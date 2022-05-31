/// <reference types="@fastly/js-compute" />

import './console';

import { EResponse, Router } from "@fastly/expressly";
import { GripExpresslyRequest, GripExpresslyResponse, ServeGrip } from "@fastly/serve-grip-expressly";
import { createWebSocketControlMessage, WebSocketMessageFormat } from "@fanoutio/grip";
import { AlreadyExistsError, HttpError, NotFoundError, Persistence } from "./services/Persistence";

const serveGrip = new ServeGrip({
  grip: {
    control_uri: 'http://localhost:5561/',
    backend: 'grip-publisher',
  }
});

const router = new Router();
router.use(serveGrip as any);

const instance = new Persistence();
async function processAndSendJsonResult(res: EResponse, fn: () => {} | Promise<{}>) {

  let result = {};
  try {
    result = await fn();
  } catch(ex) {
    if(ex instanceof NotFoundError) {
      res.withStatus(404);
      res.send(ex.message);
      return;
    }
    if(ex instanceof AlreadyExistsError) {
      res.withStatus(400);
      res.send(ex.message);
      return;
    }
    if(ex instanceof HttpError) {
      res.withStatus(ex.status);
      res.send(ex.message);
      return;
    }
  }

  const body = JSON.stringify(result);
  res.setHeader('Content-Type', 'application/json');
  res.send(body);

}

router.get('/api/channel/:channel/subscriptions', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.getSubs(req.params.channel));
});
router.get('/api/rooms/', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.getKnownRooms());
});
router.get('/api/room/:roomId', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.getRoomInfo(req.params.roomId));
});
router.get('/api/room/:roomId/questions', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.getQuestionsForRoom(req.params.roomId));
});
router.get('/api/users/', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.getKnownUsers());
});
router.get('/api/user/:userId', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.getUserInfo(req.params.userId));
});

// Proxy these for now
router.put('/api/channel/:channel/subscription/:cid', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.addSub(req.params.channel, req.params.cid));
});
router.delete('/api/channel/:channel/subscription/:cid', async (req, res) => {
  await processAndSendJsonResult(res, async () => await instance.removeSub(req.params.channel, req.params.cid));
});
router.post('/api/rooms/', async (req, res) => {
  const body = JSON.parse(await req.text());
  await processAndSendJsonResult(res, async () => await instance.createRoom(body.roomId));
});
router.post('/api/room/:roomId/questions', async(req, res) => {
  const body = JSON.parse(await req.text());
  await processAndSendJsonResult(res, async () => await instance.addQuestionToRoom(req.params.userId, body.roomId, body.questionId, body.questionText));
});
router.post('/api/room/:roomId/question/:questionId/up-vote', async(req, res) => {
  const body = JSON.parse(await req.text());
  await processAndSendJsonResult(res, async () => await instance.upVoteQuestion(req.params.roomId, body.userId, req.params.questionId, body.removeUpvote));
});

// Websocket-over-HTTP is translated to HTTP POST
router.post('/api/websocket', async (req: GripExpresslyRequest, res: GripExpresslyResponse) => {

  // This is how you read a query param in Expressly
  const roomId = req.query.get('roomId');
  if(roomId == null) {
    console.log('[missing room]');
    res.status = 400;
    res.end('[missing room]\n');
    return;
  }

  const {wsContext} = req.grip ?? {};
  if (wsContext == null) {
    console.log('[not a websocket request]');
    res.status = 400;
    res.end('[not a websocket request]\n');
    return;
  }

  console.log('incoming ', wsContext.id);
  wsContext.sendControl(createWebSocketControlMessage('keep-alive', { content: '{}', timeout: 20 }))

  // If this is a new connection, accept it and subscribe it to a channel
  if (wsContext.isOpening()) {
    console.log('is opening');
    wsContext.accept();
    wsContext.subscribe('room-' + roomId);
    try {
      await instance.addSub('room-' + roomId, wsContext.id);
    } catch {
    }
    wsContext.subscribe('rooms');
    try {
      await instance.addSub('room', wsContext.id);
    } catch {
    }
  }

  // A queue of messages that we may want to publish as a result of
  // processing the incoming messages;
  const messagesToPublish: { channel: string, messageFormat: WebSocketMessageFormat, }[] = [];

  while (wsContext.canRecv()) {
    let message: string | null;
    try {
      message = wsContext.recv();
    } catch(ex) {
      console.log('client disconnected');
      message = null;
    }

    if (message == null) {
      console.log('client closed');
      // If return value is undefined then connection is closed
      wsContext.close();
      try {
        await instance.removeSub('*', wsContext.id);
      } catch {
      }
      break;
    }

    let messageContent;
    try {
      // We hope it's a JSON message
      messageContent = JSON.parse(message);
    } catch {
      // Can't parse this message as JSON, we skip it
      console.log('Can\'t parse as JSON, skipping: ' + message);
      continue;
    }

    switch(messageContent.type) {
    case 'QUESTION_POST_TO_ROOM': {
      const { roomId, userId, questionId, questionText } = messageContent;
      console.log('Post Question', messageContent);

      // Save to backing store
      const persistenceResult = await instance.addQuestionToRoom(roomId, userId, questionId, questionText);
      
      // Send the whole question as passive update to give it to everyone listening
      // on that room.
      const message = {
        type: 'QUESTION_UPDATE_INFO_PASSIVE',
        roomId,
        questionId: persistenceResult.id,
        questionText: persistenceResult.questionText,
        questionTimestamp: persistenceResult.questionTimestamp,
        author: persistenceResult.author,
        upVotes: persistenceResult.upVotes,
      };
      console.log('Broadcasting', message);
      messagesToPublish.push({
        channel: 'room-' + roomId,
        messageFormat: new WebSocketMessageFormat(JSON.stringify(message)),
      });

      break;
    }
    case 'QUESTION_DELETE': {
      const { roomId, questionId } = messageContent;
      console.log('Delete Question', messageContent);

      // Save to backing store
      await instance.deleteQuestion(roomId, questionId);

      // Send to everyone in room
      // Publishing to websockets
      const message = {
        type: 'QUESTION_DELETE_PASSIVE',
        roomId,
        questionId,
      };
      console.log('Broadcasting', message);
      messagesToPublish.push({
        channel: 'room-' + roomId,
        messageFormat: new WebSocketMessageFormat(JSON.stringify(message)),
      });

      break;
    }
    case 'QUESTION_UPVOTE': {
      const { roomId, userId, questionId, removeUpvote } = messageContent;
      console.log('Upvote Question', messageContent);

      // Save to backing store
      const persistenceResult = await instance.upVoteQuestion(roomId, userId, questionId, removeUpvote);

      // Get updated data and send to everyone in room
      // Publishing to websockets
      const message = {
        type: 'QUESTION_UPVOTE_PASSIVE',
        roomId,
        questionId,
        upVotes: persistenceResult.upVotes
      };
      console.log('Broadcasting', message);
      messagesToPublish.push({
        channel: 'room-' + roomId,
        messageFormat: new WebSocketMessageFormat(JSON.stringify(message)),
      });

      break;
    }
    }
  }

  if(messagesToPublish.length > 0) {
    const publisher = serveGrip.getPublisher();
    for(const messageToPublish of messagesToPublish) {
      const { channel, messageFormat } = messageToPublish;
      await publisher.publishFormats(channel, messageFormat);
    }

  }

  res.setHeader('Keep-Alive-Interval', '20');
  res.end('');
});

router.listen();