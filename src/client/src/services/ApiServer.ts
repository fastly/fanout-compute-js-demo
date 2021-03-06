import { ConnectionCount, FullRoomInfo, QuestionInfo, RoomInfo, Server, UserInfo } from "../../../data/src";
import { API_URL_BASE } from "../constants";

export class ApiServer implements Server {
  constructor(protected baseUrl: string) {}
  async callApi(method: string, path: string, body?: any): Promise<any> {
    const url = new URL('.' + path, this.baseUrl);
    const response = await fetch(url, {
      method,
      body: body != null ? JSON.stringify(body) : undefined,
      headers: {
        ...body != null ? {
          'Content-Type': 'application/json'
        } : null,
      }
    });
    return await response.json();
  }
  async getSubs(channel: string): Promise<ConnectionCount> {
    return this.callApi('GET', `/api/channel/${channel}/subscriptions`);
  }
  async getKnownUsers(): Promise<Record<string, UserInfo>> {
    return this.callApi('GET', `/api/users`);
  }
  async getUserInfo(userId: string): Promise<UserInfo> {
    return this.callApi('GET', `/api/user/${userId}`);
  }
  async getKnownRooms(): Promise<Record<string, RoomInfo>> {
    return this.callApi('GET', `/api/rooms`);
  }
  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    return this.callApi('GET', `/api/room/${roomId}`);
  }
  async getQuestionsForRoom(roomId: string): Promise<QuestionInfo[]> {
    return this.callApi('GET', `/api/room/${roomId}/questions`);
  }
  async getFullRoomInfo(roomId: string): Promise<FullRoomInfo> {
    return this.callApi('GET', `/api/room/${roomId}/full`);
  }
  async createRoom(roomId: string, displayName?: string, themeColor?: string): Promise<RoomInfo> {
    return this.callApi('POST', `/api/rooms`, {roomId, displayName, themeColor});
  }
}

export const instance = new ApiServer(API_URL_BASE);
