import { ConnectionCount, FullRoomInfo, PersistenceServer, QuestionData, QuestionInfo, RoomData, RoomInfo, UserData, UserInfo, } from "../../../data/src";
import { PERSISTENCE_BACKEND, PERSISTENCE_URL_BASE } from "../env";

export class NotFoundError extends Error {}
export class AlreadyExistsError extends Error {}
export class HttpError extends Error {
  constructor(public status: number, message?: string) {
    super(message);
  }
}

// A backend app. Currently we use this (maybe until we have object store working)
export class Persistence implements PersistenceServer {

  async callApi(method: string, path: string, body?: string | {}): Promise<any> {

    const [pathname, searchParams] = path.split('?');

    // 'https://www.example.com/path/' with '/api/rooms' should give
    // 'https://www.example.com/path/api/rooms'
    const segments = [
      String(new URL('.' + pathname, PERSISTENCE_URL_BASE)),
      searchParams != null ? searchParams : '',
    ];
    const proxyUrl = segments
      .filter(x => x !== '')
      .join('?');

    let fetchBody = undefined;
    if (body != null) {
      fetchBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    let res: Response;
    try {
      res = await fetch(proxyUrl, {
        method,
        backend: PERSISTENCE_BACKEND,
        headers: {
          'Content-Type': 'application/json',
        },
        body: fetchBody,
      });
    } catch (ex) {
      throw new HttpError(500, 'Fetch error: ' + String(ex));
    }

    let text: string | null = null;

    if (res.status === 404) {
      text = text ?? await res.text();
      if (text.startsWith('Not Found')) {
        throw new NotFoundError(text);
      }
    }

    if (res.status === 400) {
      text = text ?? await res.text();
      if (text.startsWith('Already exists')) {
        throw new AlreadyExistsError(text);
      }
    }

    if (res.status === 204) {
      return void 0;
    }

    if (res.status >= 400) {
      text = text ?? await res.text();
      throw new HttpError(res.status, text);
    }

    return text != null ? JSON.parse(text) : await res.json();
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

  async createRoom(roomId: string, displayName?: string, themeColor?: string): Promise<RoomInfo> {
    return this.callApi('POST', `/api/rooms`, {roomId, displayName, themeColor});
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
