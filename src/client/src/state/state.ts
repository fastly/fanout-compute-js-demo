import { useReducerWithThunk } from "../util/reducerWithThunk";
import {
  createQuestionInfo,
  createRoomInfo,
  createUserInfo,
  mergeQuestionData,
  mergeRoomData,
  mergeUserData,
  QuestionData,
  QuestionInfo,
  RoomData,
  RoomInfo,
  UserData,
  UserInfo
} from "../../../data/src";

export interface AppStateFlags {
  joiningRoom: boolean;
  leavingRoom: boolean;
}

export interface AppState {
  subMode?: string;
  subModeParams?: Record<string, any>;
  test_mode: boolean;
  test_mode_button: boolean;
  stateFlags: AppStateFlags;
  currentRoomId: string | null;
  currentUserId: string | null;
  isHost: boolean;
  questions: QuestionInfo[];
  knownRooms: Record<string, RoomInfo>;
  knownUsers: Record<string, UserInfo>;
}

const initialState: AppState = {
  subMode: undefined,
  subModeParams: undefined,
  test_mode: false,
  test_mode_button: true,
  stateFlags: {
    joiningRoom: false,
    leavingRoom: false,
  },
  currentRoomId: null,
  currentUserId: null,
  isHost: false,
  knownUsers: {},
  knownRooms: {},
  questions: [],
};

interface ActionTestMode {
  type: 'TEST_MODE';
  value: boolean;
}

interface ActionSubModeSwitchTo {
  type: 'MODE_SUBMODE_SWITCH_TO';
  subMode?: string;
  params?: Record<string, any>;
}

interface ActionSetJoiningRoom {
  type: 'APPSTATE_SET_FLAG';
  key: keyof AppStateFlags;
  value: boolean;
}

interface ActionSetIsHost {
  type: 'SET_IS_HOST';
  value: boolean;
}

interface ActionSetUserId {
  type: 'USER_SET_ID';
  value: string | null;
}
interface ActionSetKnownUserInfo extends UserData {
  type: 'KNOWNUSER_SET_INFO';
  userId: string;
}
interface ActionUpdateKnownUserInfo extends Partial<UserData> {
  type: 'KNOWNUSER_UPDATE_INFO';
  userId: string;
}
interface ActionSetRoomId {
  type: 'ROOM_SET_ID';
  value: string | null;
}
interface ActionSetKnownRoomInfo extends RoomData {
  type: 'KNOWNROOM_SET_INFO';
  roomId: string;
}
interface ActionUpdateKnownRoomInfo extends Partial<RoomData> {
  type: 'KNOWNROOM_UPDATE_INFO';
  roomId: string;
}

interface ActionQuestionDelete {
  type: 'QUESTION_DELETE';
  roomId: string;
  questionId: string;
}

interface ActionQuestionsForgetAll {
  type: 'QUESTIONS_FORGET_ALL';
}

// This is for loading the question from persistence.
// Items are always upserted into the local state
interface ActionQuestionSetInfo extends QuestionData {
  type: 'QUESTION_SET_INFO';
  questionId: string;
}

interface ActionQuestionUpdateInfo extends Partial<QuestionData> {
  type: 'QUESTION_UPDATE_INFO';
  roomId: string;
  questionId: string;
}

interface ActionQuestionUpvote {
  type: 'QUESTION_UPVOTE';
  roomId: string,
  questionId: string,
  upVotes: string[],
}

export type AppStateAction =
  ActionTestMode |
  ActionSubModeSwitchTo |
  ActionSetJoiningRoom |
  ActionSetUserId |
  ActionSetIsHost |
  ActionSetKnownUserInfo |
  ActionUpdateKnownUserInfo |
  ActionSetRoomId |
  ActionSetKnownRoomInfo |
  ActionUpdateKnownRoomInfo |
  ActionQuestionsForgetAll |
  ActionQuestionSetInfo |
  ActionQuestionUpdateInfo |
  ActionQuestionDelete |
  ActionQuestionUpvote;

function reducer(state: AppState, action: AppStateAction): AppState {
  switch(action.type) {
    case 'TEST_MODE':
      return {
        ...state,
        test_mode: action.value,
      };
    case 'MODE_SUBMODE_SWITCH_TO':
      return {
        ...state,
        subMode: action.subMode,
        subModeParams: action.params,
      };
    case 'APPSTATE_SET_FLAG':
      return {
        ...state,
        stateFlags: {
          ...state.stateFlags,
          [action.key]: action.value,
        },
      };
    case 'SET_IS_HOST':
      return {
        ...state,
        isHost: action.value,
      };
    case 'ROOM_SET_ID':
      return {
        ...state,
        currentRoomId: action.value,
      };
    case 'KNOWNROOM_SET_INFO':
      return {
        ...state,
        knownRooms: {
          ...state.knownRooms,
          [action.roomId]: {
            id: action.roomId,
            displayName: action.displayName,
            themeColor: action.themeColor,
          },
        },
      };
    case 'KNOWNROOM_UPDATE_INFO': {
      const upsertItem: RoomInfo = state.knownRooms[action.roomId] != null ? {
        ...state.knownRooms[action.roomId]
      } : createRoomInfo(action.roomId);

      const needUpdate = mergeRoomData(upsertItem, action);
      if(!needUpdate) {
        return state;
      }

      const knownRooms = {
        ...state.knownRooms,
        [action.roomId]: upsertItem,
      };

      return {
        ...state,
        knownRooms,
      };
    }
    case 'USER_SET_ID':
      return {
        ...state,
        currentUserId: action.value,
      };
    case 'KNOWNUSER_SET_INFO':
      return {
        ...state,
        knownUsers: {
          ...state.knownUsers,
          [action.userId]: {
            id: action.userId,
            displayName: action.displayName,
          },
        },
      };
    case 'KNOWNUSER_UPDATE_INFO': {
      const upsertItem: UserInfo = state.knownUsers[action.userId] != null ? {
        ...state.knownUsers[action.userId]
      } : createUserInfo(action.userId);

      const needUpdate = mergeUserData(upsertItem, action);
      if(!needUpdate) {
        return state;
      }

      const knownUsers = {
        ...state.knownUsers,
        [action.userId]: upsertItem,
      };

      return {
        ...state,
        knownUsers,
      };
    }
    case 'QUESTIONS_FORGET_ALL': {
      return {
        ...state,
        questions: [],
      };
    }
    case 'QUESTION_DELETE': {
      const questionIndex = state.questions.findIndex(q => q.id === action.questionId);
      if(questionIndex === -1) {
        return state;
      }
      const questions = state.questions.filter(x => x.id !== action.questionId);
      return {
        ...state,
        questions,
      };
    }
    case 'QUESTION_SET_INFO': {
      const questionIndex = state.questions.findIndex(q => q.id === action.questionId);

      const upsertItem = questionIndex !== -1 ? {
        ...state.questions[questionIndex],
      } : createQuestionInfo(action.questionId, action.questionText, action.author);

      mergeQuestionData(upsertItem, action);

      const questions: QuestionInfo[] = questionIndex === -1 ?
        [
          ...state.questions,
          upsertItem,
        ] :
        [
          ...state.questions.slice(0, questionIndex),
          upsertItem,
          ...state.questions.slice(questionIndex + 1),
        ];

      return {
        ...state,
        questions,
      };
    }
    case 'QUESTION_UPDATE_INFO': {
      const questionIndex = state.questions.findIndex(q => q.id === action.questionId);

      const upsertItem: QuestionInfo = questionIndex !== -1 ? {
        ...state.questions[questionIndex],
      } : createQuestionInfo(action.questionId, '', '');

      const needUpdate = mergeQuestionData(upsertItem, action);
      if(!needUpdate) {
        return state;
      }

      const questions: QuestionInfo[] = questionIndex !== -1 ? [
        ...state.questions.slice(0, questionIndex),
        upsertItem,
        ...state.questions.slice(questionIndex + 1),
      ] : [
        ...state.questions,
        upsertItem,
      ];

      return {
        ...state,
        questions,
      };
    }
    case 'QUESTION_UPVOTE': {
      if(state.currentRoomId !== action.roomId) {
        return state;
      }
      const questionIndex = state.questions.findIndex(q => q.id === action.questionId);
      if(questionIndex === -1) {
        return state;
      }
      const questions: QuestionInfo[] = [
        ...state.questions.slice(0, questionIndex),
        {
          ...state.questions[questionIndex],
          upVotes: action.upVotes,
        },
        ...state.questions.slice(questionIndex + 1),
      ];

      return {
        ...state,
        questions,
      };
    }
  }
  return state;
}

export function useAppStateReducer() {
  return useReducerWithThunk(reducer, initialState);
}
