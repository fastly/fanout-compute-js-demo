// Connections
export interface ConnectionCount {
  channel: string;
  count: number;
}

// Rooms stored in store: <appid>_objects
// key = room_<id>, value = JSON
export interface RoomInfo {
  id: string;
  displayName: string;
  themeColor: string;
}

// Users stored in store: <appid>_objects
// key = user_<id>, value = JSON
export interface UserInfo {
  id: string;
  displayName: string;
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

// Upvotes stored:
// key = q_
