import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { instance, AlreadyExistsError, NotFoundError } from './PersistenceApiServer';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

function asyncHandler(fn: (req: Request, res: Response) => Promise<void>):
    (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next) => {
    try {
      await fn(req, res);
    } catch(ex) {
      next(ex);
    }
  }
}

app.get('/api/channel/:channel/subscriptions', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getSubs(req.params.channel)));
  res.end();
}));
app.put('/api/channel/:channel/subscription/:cid', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.addSub(req.params.channel, req.params.cid)));
  res.end();
}));
app.delete('/api/channel/:channel/subscription/:cid', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.removeSub(req.params.channel, req.params.cid)));
  res.end();
}));

app.get('/api/users/', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getKnownUsers()));
  res.end();
}));
app.get('/api/user/:userId', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getUserInfo(req.params.userId)));
  res.end();
}));
app.post('/api/user/:userId/update', asyncHandler(async(req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.updateUserInfo(req.params.userId, req.body)));
  res.end();
}));

app.get('/api/rooms/', asyncHandler (async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getKnownRooms()));
  res.end();
}));
app.get('/api/room/:roomId', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getRoomInfo(req.params.roomId)));
  res.end();
}));
app.post('/api/rooms/', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.createRoom(req.body.roomId)));
  res.end();
}));
app.get('/api/room/:roomId/full', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getFullRoomInfo(req.params.roomId)));
  res.end();
}));
app.post('/api/room/:roomId/update', asyncHandler(async(req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.updateRoomInfo(req.params.roomId, req.body)));
  res.end();
}));

app.get('/api/room/:roomId/questions', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.getQuestionsForRoom(req.params.roomId)));
  res.end();
}));
app.post('/api/room/:roomId/questions', asyncHandler(async(req, res) => {

  const messages = [];
  const userId = req.body.userId;
  if(typeof userId !== 'string') {
    messages.push('userId must be type string');
  }

  const questionText = req.body.questionText;
  if(typeof questionText !== 'string') {
    messages.push('questionText must be type string');
  }

  const questionId = req.body.questionId;
  if(typeof questionId !== 'string') {
    messages.push('questionId must be type string');
  }

  if(messages.length > 0) {
    res.status(400);
    res.send(messages.join('\n'));
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.addQuestionToRoom(req.params.roomId, userId, questionId, questionText)));
  res.end();

}));
app.delete('/api/room/:roomId/question/:questionId', asyncHandler(async(req, res) => {

  await instance.deleteQuestion(req.params.roomId, req.params.questionId);
  res.status(204);
  res.end();

}));

app.post('/api/room/:roomId/question/:questionId/update', asyncHandler(async(req, res) => {

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.updateQuestion(req.params.roomId, req.params.questionId, req.body)));
  res.end();

}));

app.post('/api/room/:roomId/question/:questionId/up-vote', asyncHandler(async(req, res) => {

  const messages = [];
  const userId = req.body.userId;
  if(typeof userId !== 'string') {
    messages.push('userId must be type string');
  }
  if(messages.length > 0) {
    res.status(400);
    res.send(messages.join('\n'));
    res.end();
    return;
  }

  const removeUpvote = req.body.removeUpvote;

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await instance.upVoteQuestion(req.params.roomId, userId, req.params.questionId, removeUpvote)));
  res.end();

}));

app.get('/', (req, res) => {
  res.send('ok')
  res.end();
});

app.get('/*', (req, res) => {
  res.status(404);
  res.send('Resource not found.');
  res.end();
})

app.use((err, req, res, next) => {

  if(err instanceof NotFoundError) {
    res.status(404);
    res.send('Not Found' + (err.message != null ? ': ' + err.message : ''));
    res.end();
    return;
  }

  if(err instanceof AlreadyExistsError) {
    res.status(400);
    res.send('Already exists' + (err.message != null ? ': ' + err.message : ''));
    res.end();
    return;
  }

  next(err);

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
