import { ActionOrFunctionDispatcher } from "../util/reducerWithThunk";
import { AppState, AppStateAction, FieldError } from "./state";
import { WebSocketContextValue } from "../websocket/components/WebSocketProviders";
import { instance } from "../services/ApiServer";
import { FullRoomInfo, generateId, } from "../../../data/src";

export class AppController {
  constructor(
    private dispatch: ActionOrFunctionDispatcher<AppState, AppStateAction>,
    private wsContext: WebSocketContextValue,
  ) {}
  isWebsocketConnected() {
    return this.wsContext.getSocket() != null;
  }
  openWs(roomId: string) {
    this.wsContext.open('ws://localhost:7999/api/websocket?roomId=' + roomId);
  }
  closeWs() {
    this.wsContext.close();
  }
  testMode() {
    this.dispatch({
      type: 'TEST_MODE',
    });
  }
  async enterRoom(userId: string, roomId: string, asHost: boolean, errorFn?: (fields: FieldError[]) => void) {
    this.dispatch(async (dispatch, getState) => {
      if(getState().stateFlags.joiningRoom || getState().stateFlags.leavingRoom) {
        return;
      }
      this.dispatch({
        type: 'APPSTATE_SET_FLAG',
        key: 'joiningRoom',
        value: true,
      });
      try {
        const errors: FieldError[] = [];
        // make sure user ID and room ID are valid.
        // 4-16 alphanumeric + underscore, must start with alphabet, must not end with underscore
        const idValidateRegex = /^[A-Za-z]\w{1,14}[A-Za-z\d]$/;
        if(!idValidateRegex.test(userId)) {
          errors.push({
            fieldName: 'userId',
            errorDescription: 'User ID must be 4-16 alphanumeric + underscore, must start with alphabet, must not end with underscore',
          });
        }
        if(!idValidateRegex.test(roomId)) {
          errors.push({
            fieldName: 'userId',
            errorDescription: 'User ID must be 4-16 alphanumeric + underscore, must start with alphabet, must not end with underscore',
          });
        }
        if(errors.length > 0) {
          if(errorFn != null) {
            errorFn(errors);
          }
          return;
        }
        let roomInfoFull: FullRoomInfo;
        try {
          roomInfoFull = await instance.getFullRoomInfo(roomId);
        } catch {
          // TODO: If room doesn't exist, we have to create a room
          return;
        }

        this.dispatch({
          type: 'MODE_SWITCH_TO',
          mode: 'room',
        });
        this.dispatch({
          type: 'USER_SET_ID',
          value: userId,
        });
        this.dispatch({
          type: 'ROOM_SET_ID',
          value: roomId,
        });
        this.dispatch({
          type: 'SET_IS_HOST',
          value: asHost,
        });

        this.openWs(roomId);
        // TODO error stuff
        const connectPromise = new Promise<void>(resolve => {
          this.wsContext.getSocket()?.addEventListener('message', (e) => {
            let data: any;
            try {
              data = JSON.parse(e.data);
            } catch {
              console.log('non-JSON payload, not sure what to do, ignoring', e.data);
            }
            this.passiveUpdate(data);
          })
          this.wsContext.getSocket()?.addEventListener('open', () => {
            resolve();
          });
        });

        const actions: AppStateAction[] = [];

        actions.push({
          type: 'KNOWNROOM_SET_INFO',
          roomId: roomInfoFull.roomInfo.id,
          displayName: roomInfoFull.roomInfo.displayName,
          themeColor: roomInfoFull.roomInfo.themeColor,
        })

        for(const question of roomInfoFull.questions) {
          actions.push({
            type: 'QUESTION_SET_INFO',
            questionId: question.id,
            questionText: question.questionText,
            questionTimestamp: question.questionTimestamp,
            author: question.author,
            answerText: question.answerText,
            answerTimestamp: question.answerTimestamp,
            answerAuthor: question.answerAuthor,
            upVotes: question.upVotes,
          });
        }

        for(const userInfo of roomInfoFull.userInfos) {
          actions.push({
            type: 'KNOWNUSER_SET_INFO',
            userId: userInfo.id,
            displayName: userInfo.displayName,
          });
        }

        for (const action of actions) {
          this.dispatch(action);
        }

        await connectPromise;

      } finally {
        this.dispatch({
          type: 'APPSTATE_SET_FLAG',
          key: 'joiningRoom',
          value: false,
        });
      }
    });
  }
  async leaveRoom() {
    this.dispatch(async (dispatch, getState) => {
      if (getState().stateFlags.joiningRoom || getState().stateFlags.leavingRoom) {
        return;
      }
      this.dispatch({
        type: 'APPSTATE_SET_FLAG',
        key: 'leavingRoom',
        value: true,
      });
      try {
        this.closeWs();
        this.dispatch({
          type: 'USER_SET_ID',
          value: null,
        });
        this.dispatch({
          type: 'ROOM_SET_ID',
          value: null,
        });
        this.dispatch({
          type: 'QUESTIONS_FORGET_ALL',
        });
        this.dispatch({
          type: 'SET_IS_HOST',
          value: false,
        });
      } finally {
        this.dispatch({
          type: 'APPSTATE_SET_FLAG',
          key: 'leavingRoom',
          value: false,
        });
      }
    });
  }
  switchToMode(mode: string) {
    this.dispatch({
      type: 'MODE_SWITCH_TO',
      mode,
    });
  }
  async postQuestion(questionText: string) {
    if(!this.isWebsocketConnected()) {
      return;
    }
    this.dispatch(async (dispatch, getState) => {

      const state = getState();
      const userId = state.currentUserId;
      const roomId = state.currentRoomId;
      const stateFlags = state.stateFlags;

      if (userId == null ||
        roomId == null ||
        stateFlags.joiningRoom ||
        stateFlags.leavingRoom
      ) {
        return;
      }

      const questionId = generateId(8);

      this.dispatch({
        type: 'QUESTION_SET_INFO',
        questionId,
        questionText,
        questionTimestamp: new Date(),
        author: userId,
        answerText: null,
        answerTimestamp: null,
        answerAuthor: null,
        upVotes: [ userId ],
      })

      const payload = {
        type: 'QUESTION_POST_TO_ROOM',
        userId,
        roomId,
        questionId,
        questionText,
      };

      this.wsContext.send(JSON.stringify(payload));
    });
  }
  async deleteQuestion(questionId: string) {
    if(!this.isWebsocketConnected()) {
      // make sure we only delete questions when
      // we are connected to websocket
      return;
    }
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const userId = state.currentUserId;
      const roomId = state.currentRoomId;
      const stateFlags = state.stateFlags;
      if (userId == null ||
        roomId == null ||
        stateFlags.joiningRoom ||
        stateFlags.leavingRoom
      ) {
        return;
      }

      const payload = {
        type: 'QUESTION_DELETE',
        userId,
        roomId,
        questionId,
      };

      this.wsContext.send(JSON.stringify(payload));

    });
  }
  upVoteQuestion(questionId: string, removeUpvote: boolean) {
    if(!this.isWebsocketConnected()) {
      // make sure we only upVote questions when
      // we are connected to websocket
      return;
    }
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const userId = state.currentUserId;
      const roomId = state.currentRoomId;
      const stateFlags = state.stateFlags;
      if (userId == null ||
        roomId == null ||
        stateFlags.joiningRoom ||
        stateFlags.leavingRoom
      ) {
        return;
      }

      const payload = {
        type: 'QUESTION_UPVOTE',
        userId,
        roomId,
        questionId,
        removeUpvote,
      };

      this.wsContext.send(JSON.stringify(payload));
    });
  }
  passiveUpdate(
    data: any
  ) {
    // This is a message from websocket
    switch(data.type) {
    case 'QUESTION_DELETE_PASSIVE':
      this.deleteQuestionPassive(
        data.roomId,
        data.questionId
      );
      return;
    case 'QUESTION_UPDATE_INFO_PASSIVE':
      this.updateQuestionInfoPassive(
        data.roomId,
        data.questionId,
        {
          questionText: data.questionText,
          questionTimestamp: data.questionTimestamp,
          author: data.author,
          answerText: data.answerText,
          answerTimestamp: data.answerTimestamp,
          answerAuthor: data.answerAuthor,
          upVotes: data.upVotes,
        }
      );
      if(data.userInfo != null) {
        this.dispatch({
          type: 'KNOWNUSER_SET_INFO',
          userId: data.userInfo.id,
          displayName: data.userInfo.displayName,
        });
      }
      return;
    case 'QUESTION_UPVOTE_PASSIVE':
      this.upVoteQuestionPassive(
        data.roomId,
        data.questionId,
        data.upVotes
      );
      if(data.userInfo != null) {
        this.dispatch({
          type: 'KNOWNUSER_SET_INFO',
          userId: data.userInfo.id,
          displayName: data.userInfo.displayName,
        });
      }
      return;
    }
  }
  deleteQuestionPassive(
    roomId: string,
    questionId: string,
  ) {
    this.dispatch({
      type: 'QUESTION_DELETE',
      roomId,
      questionId,
    });
  }
  updateQuestionInfoPassive(
    roomId: string,
    questionId: string,
    data: any
  ) {
    this.dispatch({
      type: 'QUESTION_UPDATE_INFO',
      roomId,
      questionId,
      questionText: data.questionText,
      questionTimestamp: data.questionTimestamp,
      author: data.author,
      answerText: data.answerText,
      answerTimestamp: data.answerTimestamp,
      answerAuthor: data.answerAuthor,
      upVotes: data.upVotes,
    });
  }
  upVoteQuestionPassive(
    roomId: string,
    questionId: string,
    upVotes: string[],
  ) {
    this.dispatch({
      type: 'QUESTION_UPVOTE',
      roomId,
      questionId,
      upVotes,
    });
  }
}
