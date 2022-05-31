import { ActionOrFunctionDispatcher } from "../util/reducerWithThunk";
import { AppState, AppStateAction, FieldError } from "./state";
import { WebSocketContextValue } from "../websocket/components/WebSocketProviders";
import { instance } from "../services/ApiServer";
import { generateId, RoomInfo, UserInfo } from "../../../data/src";

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
        const unknownUsernames = new Set<string>();

        const knownUsers = getState().knownUsers;
        const knownUsernames = new Set<string>(Object.keys(knownUsers));

        if(!knownUsernames.has(userId)) {
          // If we don't know about the current user, we add them too
          unknownUsernames.add(userId);
        }

        const roomInfoPromise = (async() => {
          let roomInfo: RoomInfo;
          try {
            roomInfo = await instance.getRoomInfo(roomId);
          } catch {
            roomInfo = {
              id: roomId,
              displayName: roomId,
              themeColor: '#038cfc',
            }
          }
          actions.push({
            type: 'KNOWNROOM_SET_INFO',
            roomId: roomId,
            displayName: roomInfo.displayName,
            themeColor: roomInfo.themeColor,
          });
        })();

        const questionsPromise = (async() => {
          const questions = await instance.getQuestionsForRoom(roomId);
          for(const question of questions) {
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
            if(question.author != null && !knownUsernames.has(question.author)) {
              unknownUsernames.add(question.author);
            }
            if(question.answerAuthor != null && !knownUsernames.has(question.answerAuthor)) {
              unknownUsernames.add(question.answerAuthor);
            }
          }
          const namesPromises: Promise<void>[] = [];
          for(const username of [...unknownUsernames]) {
            const namePromise = (async() => {
              let userInfo: UserInfo;
              try {
                userInfo = await instance.getUserInfo(username);
              } catch {
                userInfo = {
                  id: username,
                  displayName: username,
                };
              }
              actions.push({
                type: 'KNOWNUSER_SET_INFO',
                userId: username,
                displayName: userInfo.displayName,
              });
            })();
            namesPromises.push(namePromise);
          }
          await Promise.all(namesPromises);
        })();

        await Promise.all([connectPromise, roomInfoPromise, questionsPromise]);

        for (const action of actions) {
          this.dispatch(action);
        }

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
        data.questionText,
        data.questionTimestamp,
        data.author,
        data.upVotes
      );
      return;
    case 'QUESTION_UPVOTE_PASSIVE':
      this.upVoteQuestionPassive(
        data.roomId,
        data.questionId,
        data.upVotes
      );
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
    questionText: string,
    questionTimestamp: Date,
    author: string,
    upVotes: string[],
  ) {
    this.dispatch({
      type: 'QUESTION_UPDATE_INFO',
      roomId,
      questionId,
      questionText,
      questionTimestamp,
      author,
      upVotes,
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
