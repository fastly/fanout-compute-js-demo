import { ActionOrFunctionDispatcher } from "../util/reducerWithThunk";
import { AppState, AppStateAction } from "./state";
import { instance } from "../services/ApiServer";
import { FullRoomInfo, generateId, QuestionInfo, RoomData, UserData, UserInfo, } from "../../../data/src";

type CreateRoomResult = {
  roomDisplayName: string,
  roomThemeColor: string,
  userId?: string,
} | false;

type EnterUserInfoResult = {
  userId: string,
  asHost: boolean,
} | false;

export class AppController {
  constructor(
    private dispatch: ActionOrFunctionDispatcher<AppState, AppStateAction>
  ) {}
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
  async enterRoom(roomId: string,
                  onCreateRoomResult: (result: CreateRoomResult) => boolean,
                  onEnterUserInfoResult: (result: EnterUserInfoResult) => boolean,
  ) {
    // land in room
    // 1. enter the room
    // room does not exist -> 2.
    // room exists -> 3.
    // 2. open create room box, accept user, room ID
    // create the room
    // enter the room -> 5.
    // 3. do we have a current user?
    // no -> 4.
    // yes -> 5.
    // 4. open enter name box
    // 5. people can use the UI
    await this.dispatch(async (dispatch, getState) => {
      console.log('Attempting to land in room', roomId);
      let roomInfoFull: FullRoomInfo;
      try {
        roomInfoFull = await instance.getFullRoomInfo(roomId);
      } catch(ex) {
        console.log('room not exist');

        const result = await this.doCreateRoomUi(roomId);
        if(!onCreateRoomResult(result) || result === false) {
          return;
        }

        // We've provided a room friendly name,
        // a room theme color, and (if not already provided)
        // a username.

        // Create a new room
        const roomInfo = await instance.createRoom(roomId, result.roomDisplayName, result.roomThemeColor);

        const userId = result.userId ?? getState().currentUserId;
        if(userId == null) {
          // This is bizarre, we should have a username by now.
          console.log("Why don't we have a username?");
        }

        let userInfos: UserInfo[] = [];
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
        };
      }

      dispatch({
        type: 'KNOWNROOM_SET_INFO',
        roomId: roomInfoFull.roomInfo.id,
        displayName: roomInfoFull.roomInfo.displayName,
        themeColor: roomInfoFull.roomInfo.themeColor,
      });

      for(const question of roomInfoFull.questions) {
        dispatch({
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
        dispatch({
          type: 'KNOWNUSER_SET_INFO',
          userId: userInfo.id,
          displayName: userInfo.displayName,
        });
      }

      if(getState().currentUserId == null) {
        // No user, so let's ask for one
        const result = await this.doEnterUserInfoUi();
        if(!onEnterUserInfoResult(result) || result === false) {
          return;
        }
        this.setUserId(result.userId, result.asHost);
        try {
          const userInfo = await instance.getUserInfo(result.userId);
          dispatch({
            type: 'KNOWNUSER_SET_INFO',
            userId: userInfo.id,
            displayName: userInfo.displayName,
          });
        } catch {
        }
      }
    });
  }
  leaveRoom() {
    this.dispatch({
      type: 'QUESTIONS_FORGET_ALL',
    });
    this.dispatch({
      type: 'SET_IS_HOST',
      value: false,
    });
  }

  createRoomUiPromiseResolver?: ((result: CreateRoomResult) => void) | null;
  async doCreateRoomUi(roomId: string) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'create-room',
      params: {
        roomId,
      },
    });
    return await new Promise<CreateRoomResult>(resolve => {
      this.createRoomUiPromiseResolver = resolve;
    });
  }
  submitCreateRoomUi(roomDisplayName: string, roomThemeColor: string, userId?: string) {
    this.leaveRoomSubUi();
    if (this.createRoomUiPromiseResolver != null) {
      this.createRoomUiPromiseResolver({roomDisplayName, roomThemeColor, userId});
      this.createRoomUiPromiseResolver = null;
    }
  }
  cancelCreateRoomUi() {
    this.leaveRoomSubUi();
    if (this.createRoomUiPromiseResolver != null) {
      this.createRoomUiPromiseResolver(false);
      this.createRoomUiPromiseResolver = null;
    }
  }

  enterUserInfoUiPromiseResolver?: ((result: EnterUserInfoResult) => void) | null;
  async doEnterUserInfoUi() {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'enter-user-info',
    });
    return await new Promise<EnterUserInfoResult>(resolve => {
      this.enterUserInfoUiPromiseResolver = resolve;
    });
  }
  submitEnterUserInfoUi(userId: string, asHost: boolean) {
    this.leaveRoomSubUi();
    if (this.enterUserInfoUiPromiseResolver != null) {
      this.enterUserInfoUiPromiseResolver({userId, asHost});
      this.enterUserInfoUiPromiseResolver = null;
    }
  }
  cancelEnterUserInfoUi() {
    this.leaveRoomSubUi();
    if (this.enterUserInfoUiPromiseResolver != null) {
      this.enterUserInfoUiPromiseResolver(false);
      this.enterUserInfoUiPromiseResolver = null;
    }
  }

  async updateUserInfo(userData: Partial<UserData>) {
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

      // this.wsContext.send(JSON.stringify(payload));
    });
  }
  async updateRoomInfo(roomId: string, roomData: Partial<RoomData>) {
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

      // this.wsContext.send(JSON.stringify(payload));
    });
  }
  async postQuestion(roomId: string, questionText: string) {
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

      // this.wsContext.send(JSON.stringify(payload));
    });
  }
  async answerQuestion(roomId: string, questionId: string, answerText: string) {
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

      // this.wsContext.send(JSON.stringify(payload));
    });
  }
  async deleteQuestion(roomId: string, questionId: string) {
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

      // this.wsContext.send(JSON.stringify(payload));
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
  enterDeleteQuestionUi(questionInfo: QuestionInfo) {
    this.dispatch({
      type: 'MODE_SUBMODE_SWITCH_TO',
      subMode: 'delete-question',
      params: {
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
  enterRoomDetailsUi() {
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

      // this.wsContext.send(JSON.stringify(payload));
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
