import { ActionOrFunctionDispatcher } from "../util/reducerWithThunk";
import { AppState, AppStateAction, FieldError } from "./state";
import { WebSocketContextValue } from "../websocket/components/WebSocketProviders";
import { instance } from "../services/ApiServer";
import { FullRoomInfo, generateId, QuestionInfo, RoomData, RoomInfo, UserData, UserInfo, } from "../../../data/src";

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
  testMode(enable: boolean = true) {
    this.dispatch({
      type: 'TEST_MODE',
      value: enable,
    });
  }
  async startNewRoom(userId: string, roomId: string, roomDisplayName: string, roomThemeColor: string, errorFn?: (fields: FieldError[]) => void) {
    await this.createOrEnterRoom(userId, roomId, true, roomDisplayName, roomThemeColor, true, errorFn);
  }
  async enterRoom(userId: string, roomId: string, asHost: boolean, errorFn?: (fields: FieldError[]) => void) {
    return this.createOrEnterRoom(userId, roomId, false, undefined, undefined, asHost, errorFn);
  }
  async createOrEnterRoom(userId: string, roomId: string, createRoom: boolean, roomDisplayName: string | undefined, roomThemeColor: string | undefined, asHost: boolean, errorFn?: (fields: FieldError[]) => void) {
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

        const validRegex = /^[a-z][-_.a-z\d]{2,14}[a-z\d]$/;
        const validChars = /^[-_.a-z\d]*$/;
        const validStart = /^[a-z]/;
        const validEnd = /[a-z\d]$/;

        function validate(id: string, label: string) {
          if(validRegex.test(id)) {
            return;
          }

          if(id.length < 4 || id.length > 16) {
            errors.push({
              fieldName: 'userId',
              errorCode: 'FORMAT',
              errorDescription: `${label} must be 4-16 characters long.`,
            });
          }
          if(!validChars.test(id)) {
            errors.push({
              fieldName: 'userId',
              errorCode: 'FORMAT',
              errorDescription: `${label} can contain letters, numbers, hyphen, dots, and underscores.`,
            });
          }
          if(!validStart.test(id)) {
            errors.push({
              fieldName: 'userId',
              errorCode: 'FORMAT',
              errorDescription: `${label} must start with a letter.`,
            });
          }
          if(!validEnd.test(id)) {
            errors.push({
              fieldName: 'userId',
              errorCode: 'FORMAT',
              errorDescription: `${label} must end with a letter or number.`,
            });
          }
        }

        validate(userId, 'Username');
        validate(roomId, 'Room ID');

        if(errors.length > 0) {
          if(errorFn != null) {
            errorFn(errors);
          }
          return;
        }
        let roomInfoFull: FullRoomInfo;
        try {
          roomInfoFull = await instance.getFullRoomInfo(roomId);
          if(createRoom) {
            // if room already exists, we say so.
            // If room doesn't exist, we have to create a room
            errors.push({
              fieldName: 'roomId',
              errorCode: 'EXISTS',
              errorDescription: 'Room already exists.',
            });
            if(errorFn != null) {
              errorFn(errors);
            }
            return;
          }
        } catch {
          if(createRoom) {

            const roomInfo = await instance.createRoom(roomId, roomDisplayName, roomThemeColor);
            let userInfos: UserInfo[] = [];
            try {
              const userInfo = await instance.getUserInfo(userId);
              userInfos.push(userInfo);
            } catch {
            }

            roomInfoFull = {
              userInfos,
              questions: [],
              roomInfo,
            }
          } else {
            // If room doesn't exist, we have to create a room
            errors.push({
              fieldName: 'roomId',
              errorCode: 'NOTEXIST',
              errorDescription: 'Room does not exist.',
            });
            if(errorFn != null) {
              errorFn(errors);
            }
            return;
          }
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
          type: 'MODE_SWITCH_TO',
          mode: 'start',
        });
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
  async updateUserInfo(userData: Partial<UserData>) {
    if(!this.isWebsocketConnected()) {
      return;
    }
    this.dispatch(async (dispatch, getState) => {

      const state = getState();
      const userId = state.currentUserId;
      const stateFlags = state.stateFlags;

      if (userId == null ||
        stateFlags.joiningRoom ||
        stateFlags.leavingRoom
      ) {
        return;
      }

      this.dispatch({
        type: 'KNOWNUSER_UPDATE_INFO',
        userId,
        displayName: userData.displayName,
      });

      const payload = {
        type: 'USERINFO_UPDATE',
        userId,
        userData,
      };

      this.wsContext.send(JSON.stringify(payload));
    });
  }
  async startRoomCreationUi(userId: string, roomId: string) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'room-creation',
      params: {
        userId,
        roomId,
      },
    });
  }
  async leaveRoomCreationUi() {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: undefined,
    });
  }
  async updateRoomInfo(roomData: Partial<RoomData>) {
    if(!this.isWebsocketConnected()) {
      return;
    }
    this.dispatch(async (dispatch, getState) => {

      const state = getState();
      const roomId = state.currentRoomId;
      const stateFlags = state.stateFlags;

      if (roomId == null ||
        stateFlags.joiningRoom ||
        stateFlags.leavingRoom
      ) {
        return;
      }

      this.dispatch({
        type: 'KNOWNROOM_UPDATE_INFO',
        roomId,
        displayName: roomData.displayName,
        themeColor: roomData.themeColor,
      });

      const payload = {
        type: 'ROOMINFO_UPDATE',
        roomId,
        roomData,
      };

      this.wsContext.send(JSON.stringify(payload));
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
  async answerQuestion(questionId: string, answerText: string) {
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

      this.dispatch({
        type: 'QUESTION_UPDATE_INFO',
        roomId,
        questionId,
        answerAuthor: userId,
        answerText,
        answerTimestamp: new Date(),
      })

      const payload = {
        type: 'QUESTION_POST_ANSWER',
        roomId,
        questionId,
        answerAuthor: userId,
        answerText,
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
  enterQuestionUi(subModeName: string, userId: string, roomInfo: RoomInfo, questionInfo: QuestionInfo) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: subModeName,
      params: {
        userId,
        roomInfo,
        questionInfo,
      },
    });
  }
  leaveQuestionUi() {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: undefined,
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
    case 'USERINFO_UPDATE_PASSIVE':
      if(data.userInfo != null) {
        this.dispatch({
          type: 'KNOWNUSER_SET_INFO',
          userId: data.userInfo.id,
          displayName: data.userInfo.displayName,
        });
      }
      return;
    case 'ROOMINFO_UPDATE_PASSIVE':
      if(data.roomInfo != null) {
        this.dispatch({
          type: 'KNOWNROOM_SET_INFO',
          roomId: data.roomInfo.id,
          displayName: data.roomInfo.displayName,
          themeColor: data.roomInfo.themeColor,
        });
      }
      return;
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
