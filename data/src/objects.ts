// Connections
export interface ConnectionCount {
  channel: string;
  count: number;
}

export interface RoomData {
  displayName: string;
  themeColor: string;
}

// Rooms stored in store: <appid>_objects
// key = room_<id>, value = JSON
export interface RoomInfo extends RoomData {
  id: string;
}

export interface UserData {
  displayName: string;
}

// Users stored in store: <appid>_objects
// key = user_<id>, value = JSON
export interface UserInfo extends UserData {
  id: string;
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

// Questions stored in store: <appid>_<roomid>_questions
// key = q_<questionTimestamp>_<author>, value = JSON
export interface QuestionInfo extends QuestionData {
  id: string; // ID is random 16 length hex (8 bytes of entropy)
}

// All the info you can ever want about a room
export interface FullRoomInfo {
  roomInfo: RoomInfo;
  questions: QuestionInfo[];
  userInfos: UserInfo[];
}

// Upvotes stored:
// key = q_
