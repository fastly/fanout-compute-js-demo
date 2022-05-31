import { ConnectionCount, FullRoomInfo, QuestionInfo, RoomInfo, UserInfo } from "./objects";

export interface Server {
  getSubs(channel: string): Promise<ConnectionCount>;
  getKnownRooms(): Promise<Record<string, RoomInfo>>;
  getKnownUsers(): Promise<Record<string, UserInfo>>;
  getRoomInfo(roomId: string): Promise<RoomInfo>;
  getUserInfo(userId: string): Promise<UserInfo>;
  getQuestionsForRoom(roomId: string): Promise<QuestionInfo[]>;
  getFullRoomInfo(roomId: string): Promise<FullRoomInfo>;
}

export interface PersistenceServer extends Server {
  addSub(channel: string, cid: string): Promise<ConnectionCount>;
  removeSub(channel: string, cid: string): Promise<ConnectionCount>;
  createRoom(roomId: string): Promise<RoomInfo>;
  addQuestionToRoom(roomId: string, userId: string, questionId: string, questionText: string): Promise<QuestionInfo>;
  deleteQuestion(roomId: string, userId: string, questionId: string): Promise<void>;
  upVoteQuestion(roomId: string, userId: string, questionId: string, removeUpvote: boolean): Promise<QuestionInfo>;
}
