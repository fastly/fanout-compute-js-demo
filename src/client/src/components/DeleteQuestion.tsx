import TimeAgo from "react-timeago";
import './DeleteQuestion.css';
import { Modal } from "../util/components/Modal";
import { useAppState } from "../state/components/AppStateProviders";
import { QuestionInfo } from "../../../data/src";
import { useAppController } from "../state/components/AppControllerProvider";
import { useRoomInfo } from "../state/components/RoomInfoProvider";

export function DeleteQuestion() {

  const appController = useAppController();
  const appState = useAppState();
  const roomInfo = useRoomInfo();
  if(appState.subMode !== 'delete-question' || appState.subModeParams == null) {
    return null;
  }
  const questionInfo: QuestionInfo = appState.subModeParams.questionInfo;

  const knownUsers = appState.knownUsers;
  const authorDisplayName = knownUsers[questionInfo.author]?.displayName ?? questionInfo.author;
  const questionTime = questionInfo.questionTimestamp;
  const questionTimeAsDate = questionTime instanceof Date ? questionTime : new Date(questionTime);

  const answerAuthorDisplayName = questionInfo.answerAuthor != null ?
    knownUsers[questionInfo.answerAuthor]?.displayName ?? questionInfo.answerAuthor : '';
  const answerTime = questionInfo.answerTimestamp;
  const answerTimeAsDate = answerTime == null ? '' :
    answerTime instanceof Date ? answerTime : new Date(answerTime);

  const answered = questionInfo.answerTimestamp != null;

  return (
    <Modal className="DeleteQuestion"
           onCancel={() => appController.leaveRoomSubUi()}
    >
      <h1>Really Delete this question?</h1>
      <div className="question-text-area">
        <div className="question-heading">
          Question:
        </div>
        <div className="question-text-section">
          <div>
            <span className="quetsion-text">{questionInfo.questionText}</span>
          </div>
          <div>
            by{' '}
            <span className="question-user">
              {authorDisplayName}
            </span>{' '}
            <span className="question-timestamp">
              (<TimeAgo date={questionTimeAsDate}></TimeAgo>)
            </span>
          </div>
        </div>
      </div>
      {answered ? (
        <div className="answered-text-area">
          <div className="answered-heading">
            Answered:
          </div>
          <div className="answered-text-section">
            <div>
              <span className="answered-text">{questionInfo.answerText}</span>
            </div>
            <div>
              by{' '}
              <span className="answered-user">
                {answerAuthorDisplayName}
              </span>{' '}
              <span className="answered-timestamp">
                (<TimeAgo date={answerTimeAsDate}></TimeAgo>)
              </span>
            </div>
          </div>
        </div>
      ) : null}
      <div className="upvotes-area">
        {questionInfo.upVotes.length} up-vote{questionInfo.upVotes.length !== 1 ? 's' : ''}
      </div>
      <div className="buttons-area">
        <button style={{
                  border: "1px solid " + roomInfo.themeColor,
                  background: roomInfo.themeColor,
                }}
                onClick={async () => {
                  await appController.leaveRoomSubUi();
                  await appController.deleteQuestion(roomInfo.id, questionInfo.id);
                }}
        >Delete</button>{' '}
        <button style={{
                  border: "1px solid " + roomInfo.themeColor,
                  background: roomInfo.themeColor,
                }}
                onClick={async () => {
                  await appController.leaveRoomSubUi();
                }}
        >Cancel</button>
      </div>
    </Modal>
  );

}
