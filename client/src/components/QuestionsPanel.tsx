import { useState } from "react";
import './QuestionsPanel.css';
import { useAppState } from "../state/components/AppStateProviders";
import { QuestionInfo, RoomInfo, UserInfo } from "../../../data/src";
import { useAppController } from "../state/components/AppControllerProvider";
import TimeAgo from 'react-timeago';

type QuestionItemProps = {
  userId: string;
  knownUsers: Record<string, UserInfo>;
  roomInfo: RoomInfo;
  questionInfo: QuestionInfo;
};
export function QuestionItem(props: QuestionItemProps) {

  const controller = useAppController();

  const userId = props.userId;
  const knownUsers = props.knownUsers;
  const roomInfo = props.roomInfo;
  const questionInfo = props.questionInfo;

  const authorDisplayName = knownUsers[questionInfo.author]?.displayName ?? questionInfo.author;
  const questionTime = questionInfo.questionTimestamp;
  const questionTimeAsDate = questionTime instanceof Date ? questionTime : new Date(questionTime);

  const answerAuthorDisplayName = questionInfo.answerAuthor != null ?
    knownUsers[questionInfo.answerAuthor]?.displayName ?? questionInfo.answerAuthor : '';
  const answerTime = questionInfo.answerTimestamp;
  const answerTimeAsDate = answerTime == null ? '' :
    answerTime instanceof Date ? answerTime : new Date(answerTime);

  const answered = questionInfo.answerTimestamp != null;
  const selfUpVoted = questionInfo.upVotes.includes(userId);

  return (
    <div className={"QuestionItem" + (answered ? ' answered' : '') + (selfUpVoted ? ' selfUpVoted' : '')}
         style={{
           ...answered ? { border: '2px solid ' + roomInfo.themeColor } : {},
         }}
    >
      <div className="body">
        <div className="question-text-area">
          <span className="question-text">{questionInfo.questionText}</span>
          <span className="question-info">
            asked by{' '}
            <span className="question-user">
              {authorDisplayName}
            </span>{' '}
            <span className="question-timestamp">
              (<TimeAgo date={questionTimeAsDate}></TimeAgo>)
            </span>
          </span>
        </div>
        {answered ? (
          <div className="answered-text-area">
            <div className="answered-heading">
              Response:
            </div>
            <div className="answered-text-section">
              <div>
                <span className="answered-text">{questionInfo.answerText}</span>
              </div>
              <div>
                &mdash;
                <span className="answered-user">
                  {answerAuthorDisplayName},
                </span>{' '}
                <span className="answered-timestamp">
                  <TimeAgo date={answerTimeAsDate}></TimeAgo>
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="margin">
        <div className="upvote">
          <button className="upvote-button"
                  style={{
                    border: "1px solid " + roomInfo.themeColor,
                    ...selfUpVoted ? { background: roomInfo.themeColor } : {},
                  }}
                  onClick={() => controller.upVoteQuestion(questionInfo.id, selfUpVoted)}
          ><div className="count">{questionInfo.upVotes.length}</div> <span className="material-icons thumbs-up-icon">thumb_up</span></button>
        </div>
      </div>
      <div className="status" style={{
        ...answered ? { background: roomInfo.themeColor } : {},
      }}>
        {answered ? 'ANSWERED' : 'UNANSWERED'}
      </div>
    </div>
  );
}

function questionListSort(a: QuestionInfo, b: QuestionInfo): number {

  // Answered questions have the highest value.
  const aAnswered = a.answerTimestamp != null ? 1 : 0;
  const bAnswered = b.answerTimestamp != null ? 1 : 0;
  const answered = aAnswered - bAnswered;
  if(answered !== 0) {
    return answered;
  }

  // if questions have the same sort value then
  // Questions are next sorted based on number of upvotes
  const upVotesDiff = a.upVotes.length - b.upVotes.length;
  if(upVotesDiff !== 0) {
    return upVotesDiff;
  }

  // Then older ones given the most value.
  // we care about when the question was asked, more than
  // when it was answered.
  const aTimestamp = a.questionTimestamp instanceof Date ? a.questionTimestamp.getTime() :
    typeof a.questionTimestamp === 'string' ? new Date(a.questionTimestamp).getTime() : 0;

  const bTimestamp = b.questionTimestamp instanceof Date ? b.questionTimestamp.getTime() :
    typeof b.questionTimestamp === 'string' ? new Date(b.questionTimestamp).getTime() : 0;

  const answerTimestampDiff = -(aTimestamp - bTimestamp);
  if(answerTimestampDiff !== 0) {
    return answerTimestampDiff;
  }

  return 0;
}

type QuestionsListProps = {
  userId: string;
  knownUsers: Record<string, UserInfo>;
  roomInfo: RoomInfo;
  questions: QuestionInfo[];
};
export function QuestionsList(props: QuestionsListProps) {

  const userId = props.userId;
  const knownUsers = props.knownUsers;
  const roomInfo = props.roomInfo;
  const sortedQuestions = props.questions.slice();
  sortedQuestions.sort(questionListSort);
  sortedQuestions.reverse();

  return (
    <div className="QuestionsList">
      {sortedQuestions.map(q => (
        <QuestionItem key={q.id}
                      userId={userId}
                      knownUsers={knownUsers}
                      roomInfo={roomInfo}
                      questionInfo={q}
        />
      ))}
    </div>
  );
}

export function QuestionEntry() {
  const controller = useAppController();

  const [ submitting, setSubmitting ] = useState<boolean>(false);
  const [ questionTextValue, setQuestionTextValue ] = useState('');

  return (
    <div className="QuestionEntry">
      <div className="question-prompt">
        Add your question!
      </div>
      <div className="question-entryarea">
        <textarea className="textentry"
                  disabled={submitting}
                  onChange={e => setQuestionTextValue(e.target.value)}
                  value={questionTextValue}
        />
      </div>
      <div className="question-buttonarea">
        <button className="question-submit"
                disabled={submitting || questionTextValue.length === 0}
                onClick={async (e) => {
                  setSubmitting(true);
                  try {
                    await controller.postQuestion(questionTextValue);
                  } finally {
                    setQuestionTextValue('');
                    setSubmitting(false);
                  }
                }}
        >
          Submit your question
        </button>
      </div>
    </div>
  );
}

export function QuestionsPanel() {

  const state = useAppState();
  const userId = state.currentUserId;
  const roomId = state.currentRoomId;
  if(userId == null || roomId == null) {
    return null;
  }

  return (
    <div className="QuestionsPanel">
      <QuestionsList userId={userId}
                     knownUsers={state.knownUsers}
                     roomInfo={state.knownRooms[roomId]}
                     questions={state.questions}
      />
      <QuestionEntry />
    </div>
  );
}
