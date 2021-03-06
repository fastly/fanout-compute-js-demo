import {
  ConnectionCount,
  QuestionInfo,
  RoomInfo,
  UserInfo,
  PersistenceServer,
  FullRoomInfo,
  QuestionData,
  UserData,
  RoomData,
  createRoomInfo,
  createUserInfo,
  createQuestionInfo,
  mergeRoomData,
  mergeUserData,
  mergeQuestionData
} from "../../data";

export class NotFoundError extends Error {}
export class AlreadyExistsError extends Error {}

class PersistenceApiServer implements PersistenceServer {
  _knownRooms: Record<string, RoomInfo> = {};
  _knownUsers: Record<string, UserInfo> = {};
  _questions: Record<string, QuestionInfo[]> = {};

  _subs: Record<string, Set<string>> = {};

  async getSubs(channel: string): Promise<ConnectionCount> {
    if(!(channel in this._subs)) {
      throw new NotFoundError('Unknown channel');
    }

    return {
      channel,
      count: this._subs[channel].size,
    };
  }

  async addSub(channel: string, cid: string): Promise<ConnectionCount> {
    if(!(channel in this._subs)) {
      this._subs[channel] = new Set<string>();
    }

    this._subs[channel].add(cid);
    return {
      channel,
      count: this._subs[channel].size,
    };
  }

  async removeSub(channel: string, cid: string): Promise<ConnectionCount> {
    if(channel === '*') {
      for(const set of Object.values(this._subs)) {
        set.delete(cid);
      }
      return {
        channel: '*',
        count: 0,
      };
    }

    if(!(channel in this._subs)) {
      throw new NotFoundError('Unknown channel');
    }

    this._subs[channel].delete(cid);
    return {
      channel,
      count: this._subs[channel].size,
    };
  }

  async getKnownUsers(): Promise<Record<string, UserInfo>> {
    return this._knownUsers;
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    if(userId in this._knownUsers) {
      return this._knownUsers[userId];
    }
    throw new NotFoundError('Unknown user');
  }

  async updateUserInfo(userId: string, userData: Partial<UserData>): Promise<UserInfo> {
    let userInfo: UserInfo = this._knownUsers[userId];
    if(userInfo == null) {
      userInfo = createUserInfo(userId);
      this._knownUsers[userId] = userInfo;
    }
    mergeUserData(userInfo, userData);
    return userInfo;
  }

  async getKnownRooms(): Promise<Record<string, RoomInfo>> {
    return this._knownRooms;
  }

  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    if(roomId in this._knownRooms) {
      return this._knownRooms[roomId];
    }
    throw new NotFoundError('Unknown room');
  }

  async updateRoomInfo(roomId: string, roomData: Partial<RoomData>): Promise<RoomInfo> {
    let roomInfo: RoomInfo = this._knownRooms[roomId];
    if(roomInfo == null) {
      roomInfo = createRoomInfo(roomId);
      this._knownRooms[roomId] = roomInfo;
    }
    mergeRoomData(roomInfo, roomData);
    return roomInfo;
  }

  async createRoom(roomId: string, displayName?: string, themeColor?: string): Promise<RoomInfo> {
    if(roomId in this._knownRooms) {
      throw new AlreadyExistsError('Room already exists');
    }
    const roomInfo = createRoomInfo(roomId, { displayName, themeColor });
    this._knownRooms[roomId] = roomInfo;
    return roomInfo;
  }

  async getQuestionsForRoom(roomId: string): Promise<QuestionInfo[]> {
    if(roomId in this._questions) {
      return this._questions[roomId];
    }
    throw new NotFoundError('Unknown room');
  }

  async getFullRoomInfo(roomId: string): Promise<FullRoomInfo> {
    if(!(roomId in this._knownRooms)) {
      throw new NotFoundError('Unknown room');
    }
    const roomInfo = this._knownRooms[roomId];
    const questions = this._questions[roomId] ?? [];
    const userInfos: UserInfo[] = [];
    const userNames = new Set<string>();
    for(const question of questions) {
      userNames.add(question.author);
      if(question.answerAuthor != null) {
        userNames.add(question.answerAuthor);
      }
      for(const upVote of question.upVotes) {
        userNames.add(upVote);
      }
    }
    for(const userName of [...userNames]) {
      if(userName in this._knownUsers) {
        userInfos.push(this._knownUsers[userName]);
      }
    }
    return {
      roomInfo,
      questions,
      userInfos,
    };
  }

  async addQuestionToRoom(roomId: string, userId: string, questionId: string, questionText: string): Promise<QuestionInfo> {

    const questionInfo = createQuestionInfo(questionId, userId, questionText);

    if(this._questions[roomId] == null) {
      this._questions[roomId] = [];
    }

    this._questions[roomId].push(questionInfo);

    return questionInfo;

  }

  async updateQuestion(roomId: string, questionId: string, questionData: Partial<QuestionData>): Promise<QuestionInfo> {
    if(!(roomId in this._knownRooms)) {
      throw new NotFoundError('Unknown room');
    }

    let upsertItem: QuestionInfo = null;
    if(roomId in this._questions) {
      upsertItem = this._questions[roomId].find(x => x.id === questionId);
    }

    if(upsertItem == null) {
      throw new NotFoundError('Unknown question');
    }

    mergeQuestionData(upsertItem, questionData);
    return upsertItem;
  }

  async deleteQuestion(roomId: string, questionId: string): Promise<void> {
    if(!(roomId in this._knownRooms)) {
      throw new NotFoundError('Unknown room');
    }

    this._questions[roomId] = this._questions[roomId].filter(x => x.id !== questionId);
  }

  async upVoteQuestion(roomId: string, userId: string, questionId: string, removeUpvote: boolean): Promise<QuestionInfo> {
    if(!(roomId in this._knownRooms)) {
      throw new NotFoundError('Unknown room');
    }

    const question = this._questions[roomId].find(q => q.id === questionId);
    if(question == null) {
      throw new NotFoundError('Unknown question');
    }

    // Add an upvote with this user
    const upVotes = new Set(question.upVotes);
    if(removeUpvote) {
      upVotes.delete(userId);
    } else {
      upVotes.add(userId);
    }
    question.upVotes = [...upVotes];

    return question;

  }

}

export const instance = new PersistenceApiServer();
