import { ActionOrFunctionDispatcher } from "../util/reducerWithThunk";
import { AppState, AppStateAction } from "./state";
import { WebSocketContextValue } from "../websocket/components/WebSocketProviders";
import { instance } from "../services/ApiServer";
import { FullRoomInfo, generateId, QuestionInfo, RoomData, RoomInfo, UserData, UserInfo, } from "../../../data/src";
import { WEBSOCKET_URL_BASE } from "../constants";

export class AppController {
  constructor(
    private dispatch: ActionOrFunctionDispatcher<AppState, AppStateAction>,
    private wsContext: WebSocketContextValue,
    private sessionId: string,
  ) {}
  isWebsocketConnected() {
    return this.wsContext.getSocket() != null;
  }
  openWs(roomId: string) {
    this.wsContext.open(WEBSOCKET_URL_BASE + '?roomId=' + roomId + (this.sessionId !== '' ? '&session=' + this.sessionId : ''));
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
  setUserId(userId: string, asHost: boolean) {
    this.dispatch({
      type: 'USER_SET_ID',
      value: userId,
    });
    this.dispatch({
      type: 'SET_IS_HOST',
      value: asHost,
    });
  }
  async startNewRoom(roomId: string, roomDisplayName: string, roomThemeColor: string) {
    await this.createOrEnterRoom(roomId, true, roomDisplayName, roomThemeColor);
  }
  async enterRoom(roomId: string) {
    await this.createOrEnterRoom(roomId, false, undefined, undefined);
  }
  async createOrEnterRoom(roomId: string, createRoom: boolean, roomDisplayName: string | undefined, roomThemeColor: string | undefined) {
    await this.dispatch(async (dispatch, getState) => {
      if(getState().stateFlags.joiningRoom || getState().stateFlags.leavingRoom) {
        return;
      }
      this.dispatch({
        type: 'APPSTATE_SET_FLAG',
        key: 'joiningRoom',
        value: true,
      });
      try {
        let roomInfoFull: FullRoomInfo;
        let createRoomAlreadyExisted = false;
        try {
          roomInfoFull = await instance.getFullRoomInfo(roomId);
          if(createRoom) {
            createRoomAlreadyExisted = true;
          }
        } catch(ex) {
          if(createRoom) {

            const roomInfo = await instance.createRoom(roomId, roomDisplayName, roomThemeColor);
            let userInfos: UserInfo[] = [];
            const userId = getState().currentUserId;
            if(userId != null) {
              try {
                const userInfo = await instance.getUserInfo(userId);
                userInfos.push(userInfo);
              } catch {
              }
            }

            roomInfoFull = {
              userInfos,
              questions: [],
              roomInfo,
            }
          } else {
            // If room doesn't exist, we have to create a room
            throw 'NOTEXIST';
          }
        }

        if(createRoomAlreadyExisted) {
          // if room already exists, we say so.
          // If room doesn't exist, we have to create a room
          throw 'EXISTS';
        }

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
  leaveRoom() {
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
  async updateRoomInfo(roomId: string, roomData: Partial<RoomData>) {
    if(!this.isWebsocketConnected()) {
      return;
    }
    this.dispatch(async (dispatch, getState) => {

      const state = getState();
      const stateFlags = state.stateFlags;

      if (stateFlags.joiningRoom ||
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
  async postQuestion(roomId: string, questionText: string) {
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
  async answerQuestion(roomId: string, questionId: string, answerText: string) {
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
  async deleteQuestion(roomId: string, questionId: string) {
    if(!this.isWebsocketConnected()) {
      // make sure we only delete questions when
      // we are connected to websocket
      return;
    }
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const userId = state.currentUserId;
      const stateFlags = state.stateFlags;
      if (userId == null ||
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
  enterAnswerQuestionUi(questionInfo: QuestionInfo) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'answer-question',
      params: {
        questionInfo,
      },
    });
  }
  enterDeleteQuestionUi(roomInfo: RoomInfo, questionInfo: QuestionInfo) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'delete-question',
      params: {
        roomInfo,
        questionInfo,
      },
    });
  }
  enterUserDetailsUi(userId: string) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'edit-user-details',
      params: {
        userId,
      },
    });
  }
  enterRoomDetailsUi(roomInfo: RoomInfo) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'edit-room-details'
    });
  }
  leaveRoomSubUi() {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: undefined,
    });
  }
  upVoteQuestion(roomId: string, questionId: string, removeUpvote: boolean) {
    if(!this.isWebsocketConnected()) {
      // make sure we only upVote questions when
      // we are connected to websocket
      return;
    }
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const userId = state.currentUserId;
      const stateFlags = state.stateFlags;
      if (userId == null ||
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
