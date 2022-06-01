import { ConnectionCount, PersistenceServer, QuestionData, QuestionInfo, RoomData, RoomInfo, UserData, UserInfo, } from "../../../data/src";
import { ApiServer } from "./ApiServer";

export class PersistenceApiServer extends ApiServer
  implements PersistenceServer {

  async addSub(channel: string, cid: string): Promise<ConnectionCount> {
    return this.callApi('PUT', `/api/channel/${channel}/subscription/${cid}`, {});
  }
  async removeSub(channel: string, cid: string): Promise<ConnectionCount> {
    return this.callApi('DELETE', `/api/channel/${channel}/subscription/${cid}`);
  }
  async updateUserInfo(userId: string, userData: Partial<UserData>): Promise<UserInfo> {
    return this.callApi('POST', `/api/user/${userId}/update`, userData);
  }
  async updateRoomInfo(roomId: string, roomData: Partial<RoomData>): Promise<RoomInfo> {
    return this.callApi('POST', `/api/room/${roomId}/update`, roomData);
  }
  async addQuestionToRoom(roomId: string, userId: string, questionId: string, questionText: string): Promise<QuestionInfo> {
    return this.callApi('POST', `/api/room/${roomId}/questions`, {userId, questionId, questionText});
  }
  async updateQuestion(roomId: string, questionId: string, questionData: Partial<QuestionData>): Promise<QuestionInfo> {
    return this.callApi('POST', `/api/room/${roomId}/question/${questionId}/update`, questionData);
  }
  async deleteQuestion(roomId: string, questionId: string): Promise<void> {
    return this.callApi('DELETE', `/api/room/${roomId}/question/${questionId}`);
  }
  async upVoteQuestion(roomId: string, userId: string, questionId: string, removeUpvote: boolean): Promise<QuestionInfo> {
    return this.callApi('POST', `/api/room/${roomId}/question/${questionId}/up-vote`, {userId, removeUpvote});
  }

}

export const instance = new PersistenceApiServer('http://localhost:3001/');
