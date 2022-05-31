import { ConnectionCount, QuestionInfo, RoomInfo, UserInfo, PersistenceServer } from "../../data/src";

export class NotFoundError extends Error {}
export class AlreadyExistsError extends Error {}

class PersistenceApiServer implements PersistenceServer {
  _knownRooms: Record<string, RoomInfo> = {
    'foo': {
      id: 'foo',
      displayName: 'Foo Room',
      themeColor: '#038cfc',
    },
    'bar': {
      id: 'bar',
      displayName: 'Bar Room',
      themeColor: '#f5429b',
    },
    'baz': {
      id: 'baz',
      displayName: 'Baz Room',
      themeColor: '#188c2d',
    },
  };

  _knownUsers: Record<string, UserInfo> = {
    'jappleseed': {
      id: 'jappleseed',
      displayName: 'Johnny Appleseed',
    },
    'prabbit': {
      id: 'prabbit',
      displayName: 'Peter Rabbit',
    },
  };

  _questions: Record<string, QuestionInfo[]> = {
    'foo': [
      {
        id: '64fc25ad1f71466a',
        questionText: 'When will be the next event?',
        questionTimestamp: new Date('2022-05-29T09:00:00+09:00'),
        author: 'jappleseed',
        upVotes: ['jappleseed'],
        answerText: 'It will be on Jun 3, 2002',
        answerTimestamp: new Date('2022-05-29T09:05:00+09:00'),
        answerAuthor: 'prabbit',
      },
      {
        id: '140ca1af98094469',
        questionText: 'How\'s the weather?',
        questionTimestamp: new Date('2022-05-29T09:01:00+09:00'),
        author: 'jappleseed',
        upVotes: ['jappleseed', 'prabbit'],
        answerText: null,
        answerTimestamp: null,
        answerAuthor: null,
      },
    ],
  };

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

  async getKnownRooms(): Promise<Record<string, RoomInfo>> {
    return this._knownRooms;
  }

  async getRoomInfo(roomId: string): Promise<RoomInfo> {
    if(roomId in this._knownRooms) {
      return this._knownRooms[roomId];
    }
    throw new NotFoundError('Unknown room');
  }

  async createRoom(roomId: string): Promise<RoomInfo> {
    if(roomId in this._knownRooms) {
      throw new AlreadyExistsError('Room already exists');
    }
    const roomInfo = {
      id: roomId,
      displayName: 'New Room: ' + roomId,
      themeColor: '#038cfc', // default color
    };
    this._knownRooms[roomId] = roomInfo;
    return roomInfo;
  }

  async getQuestionsForRoom(roomId: string): Promise<QuestionInfo[]> {
    if(roomId in this._questions) {
      return this._questions[roomId];
    }
    throw new NotFoundError('Unknown room');
  }

  async addQuestionToRoom(roomId: string, userId: string, questionId: string, questionText: string): Promise<QuestionInfo> {

    const questionInfo: QuestionInfo = {
      id: questionId,
      questionText,
      questionTimestamp: new Date(),
      author: userId,
      upVotes: [ userId ],
      answerText: null,
      answerTimestamp: null,
      answerAuthor: null,
    };

    if(this._questions[roomId] == null) {
      this._questions[roomId] = [];
    }

    this._questions[roomId].push(questionInfo);

    return questionInfo;

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
