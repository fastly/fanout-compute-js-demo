import { forwardRef, LegacyRef, useState } from "react";
import TimeAgo from 'react-timeago';
import './QuestionsPanel.css';
import { useAppState } from "../state/components/AppStateProviders";
import { QuestionInfo, UserInfo } from "../../../data/src";
import { useAppController } from "../state/components/AppControllerProvider";
import FlipMove from '../util/components/FlipMove';
import { useRoomInfo } from "../state/components/RoomInfoProvider";

export const QuestionItemForwardRef = forwardRef(QuestionItem);

type QuestionItemProps = {
  userId: string;
  knownUsers: Record<string, UserInfo>;
  questionInfo: QuestionInfo;
  isHost: boolean;
};
export function QuestionItem(props: QuestionItemProps, ref: LegacyRef<HTMLDivElement>) {

  const controller = useAppController();
  const roomInfo = useRoomInfo();

  const userId = props.userId;
  const knownUsers = props.knownUsers;
  const questionInfo = props.questionInfo;
  const isHost = props.isHost;

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
    <div ref={ref}
         className={"QuestionItem" + (answered ? ' answered' : '') + (selfUpVoted ? ' selfUpVoted' : '')}
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
                  onClick={() => controller.upVoteQuestion(roomInfo.id, questionInfo.id, selfUpVoted)}
          ><div className="count">{questionInfo.upVotes.length}</div> <span className="material-icons thumbs-up-icon">thumb_up</span></button>
        </div>
        {isHost ? (
          <div className="actions">
            {!answered ? (
              <div className="reply">
                <button className="reply"
                        style={{
                          border: "1px solid " + roomInfo.themeColor,
                        }}
                        title="Reply"
                        onClick={() => controller.enterAnswerQuestionUi(questionInfo)}
                ><span className="material-icons thumbs-up-icon">reply</span></button>
              </div>
            ) : null}
            <div className="delete">
              <button className="delete"
                      style={{
                        border: "1px solid " + roomInfo.themeColor,
                      }}
                      title="Delete"
                      onClick={() => controller.enterDeleteQuestionUi(questionInfo)}
              ><span className="material-icons thumbs-up-icon">delete</span></button>
            </div>
          </div>
        ) : null}
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
  questions: QuestionInfo[];
  isHost: boolean;
};
export function QuestionsList(props: QuestionsListProps) {

  const userId = props.userId;
  const knownUsers = props.knownUsers;
  const isHost = props.isHost;
  const sortedQuestions = props.questions.slice();
  sortedQuestions.sort(questionListSort);
  sortedQuestions.reverse();

  return (
    <FlipMove className="QuestionsList">
      {sortedQuestions.map(q => (
        <QuestionItemForwardRef key={q.id}
                                userId={userId}
                                knownUsers={knownUsers}
                                questionInfo={q}
                                isHost={isHost}
        />
      ))}
    </FlipMove>
  );
}

export function QuestionEntry() {
  const controller = useAppController();
  const roomInfo = useRoomInfo();

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
                    await controller.postQuestion(roomInfo.id, questionTextValue);
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

export function QuestionPrompt() {
  return (
    <div className="QuestionPrompt">
      <p>
        It looks like there are no questions in this room yet.
      </p>
      <p>
        Use the form below to ask the first question!
      </p>
    </div>
  );
}

export function QuestionsPanel() {

  const state = useAppState();
  const userId = state.currentUserId;
  const isHost = state.isHost;
  if(userId == null) {
    return null;
  }

  return (
    <div className="QuestionsPanel">
      <QuestionsList userId={userId}
                     knownUsers={state.knownUsers}
                     questions={state.questions}
                     isHost={isHost}
      />
      <QuestionEntry />
      {state.questions.length === 0 ? (
        <QuestionPrompt />
      ) : null}
    </div>
  );
}
