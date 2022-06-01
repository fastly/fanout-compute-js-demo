import { ConnectionCount, FullRoomInfo, PersistenceServer, QuestionData, QuestionInfo, RoomInfo, UserInfo } from "../../../data/src";

export class NotFoundError extends Error {}
export class AlreadyExistsError extends Error {}
export class HttpError extends Error {
  constructor(public status: number, message?: string) {
    super(message);
  }
}

export class Persistence implements PersistenceServer {

  // proxy to this backend until we have object store working
  persistenceBackend = 'backend-persistence';
  persistenceUrlBase = 'http://localhost:3001/';

  async callApi(method: string, path: string, body?: string | {}): Promise<any> {

    const [pathname, searchParams] = path.split('?');

    // 'https://www.example.com/path/' with '/api/rooms' should give
    // 'https://www.example.com/path/api/rooms'
    const segments = [
      String(new URL('.' + pathname, this.persistenceUrlBase)),
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
        backend: this.persistenceBackend,
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

  async createRoom(roomId: string): Promise<RoomInfo> {
    return this.callApi('POST', `/api/rooms`, {roomId});
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
