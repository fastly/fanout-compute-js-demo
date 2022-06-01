import { mergeData } from "./util";

// Connections
export interface ConnectionCount {
  channel: string;
  count: number;
}

export interface RoomData {
  displayName: string;
  themeColor: string;
}

const roomDataKeys: (keyof RoomData)[] = [
  'displayName',
  'themeColor',
];

// Rooms stored in store: <appid>_objects
// key = room_<id>, value = JSON
export interface RoomInfo extends RoomData {
  id: string;
}

export function createRoomInfo(roomId: string, data?: Partial<RoomData>): RoomInfo {
  const roomInfo: RoomInfo = {
    id: roomId,
    displayName: 'New Room:' + roomId,
    themeColor: '#038cfc', // default color
  };
  mergeRoomData(roomInfo, data);
  return roomInfo;
}
export function mergeRoomData(roomInfo: RoomInfo, data?: Partial<RoomData>): boolean {
  return mergeData(roomInfo, roomDataKeys, data);
}

export interface UserData {
  displayName: string;
}

const userDataKeys: (keyof UserData)[] = [
  'displayName',
];

// Users stored in store: <appid>_objects
// key = user_<id>, value = JSON
export interface UserInfo extends UserData {
  id: string;
}

export function createUserInfo(userId: string, data?: Partial<UserData>): UserInfo {
  const userInfo = {
    id: userId,
    displayName: userId,
  };
  mergeUserData(userInfo, data);
  return userInfo;
}
export function mergeUserData(userInfo: UserInfo, data?: Partial<UserData>): boolean {
  return mergeData(userInfo, userDataKeys, data);
}

export interface QuestionData {
  questionText: string;
  questionTimestamp: Date;
  author: string; // user ID of person who asked this
  answerText: string | null;
  answerTimestamp: Date | null;
  answerAuthor: string | null;
  upVotes: string[]; // user IDs of people who have upvoted.
}

const questionDataKeys: (keyof QuestionData)[] = [
  'questionText',
  'questionTimestamp',
  'author',
  'answerText',
  'answerTimestamp',
  'answerAuthor',
  'upVotes',
];

// Questions stored in store: <appid>_<roomid>_questions
// key = q_<questionTimestamp>_<author>, value = JSON
export interface QuestionInfo extends QuestionData {
  id: string; // ID is random 16 length hex (8 bytes of entropy)
}

export function createQuestionInfo(questionId: string, authorId: string, questionText: string, data?: Partial<QuestionData>): QuestionInfo {
  const questionInfo: QuestionInfo = {
    id: questionId,
    questionText,
    questionTimestamp: new Date(),
    author: authorId,
    upVotes: [ authorId ],
    answerText: null,
    answerTimestamp: null,
    answerAuthor: null,
  };
  mergeQuestionData(questionInfo, data);
  return questionInfo;
}
export function mergeQuestionData(questionInfo: QuestionInfo, data?: Partial<QuestionData>): boolean {
  return mergeData(questionInfo, questionDataKeys, data);
}

// All the info you can ever want about a room
export interface FullRoomInfo {
  roomInfo: RoomInfo;
  questions: QuestionInfo[];
  userInfos: UserInfo[];
}

// Upvotes stored:
// key = q_
