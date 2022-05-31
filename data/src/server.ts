import { ConnectionCount, FullRoomInfo, QuestionData, QuestionInfo, RoomInfo, UserInfo } from "./objects";

export interface Server {
  getSubs(channel: string): Promise<ConnectionCount>;
  getKnownRooms(): Promise<Record<string, RoomInfo>>;
  createRoom(roomId: string): Promise<RoomInfo>;
  getKnownUsers(): Promise<Record<string, UserInfo>>;
  getRoomInfo(roomId: string): Promise<RoomInfo>;
  getUserInfo(userId: string): Promise<UserInfo>;
  getQuestionsForRoom(roomId: string): Promise<QuestionInfo[]>;
  getFullRoomInfo(roomId: string): Promise<FullRoomInfo>;
}

export interface PersistenceServer extends Server {
  addSub(channel: string, cid: string): Promise<ConnectionCount>;
  removeSub(channel: string, cid: string): Promise<ConnectionCount>;
  addQuestionToRoom(roomId: string, userId: string, questionId: string, questionText: string): Promise<QuestionInfo>;
  updateQuestion(roomId: string, questionId: string, questionData: Partial<QuestionData>): Promise<QuestionInfo>;
  deleteQuestion(roomId: string, userId: string, questionId: string): Promise<void>;
  upVoteQuestion(roomId: string, userId: string, questionId: string, removeUpvote: boolean): Promise<QuestionInfo>;
}
