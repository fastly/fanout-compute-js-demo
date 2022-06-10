import { useState } from "react";
import TimeAgo from "react-timeago";
import './AnswerQuestion.css';
import { Modal } from "../util/components/Modal";
import { useAppState } from "../state/components/AppStateProviders";
import { QuestionInfo } from "../../../data/src";
import { useAppController } from "../state/components/AppControllerProvider";
import { useRoomInfo } from "../state/components/RoomInfoProvider";

export function AnswerQuestion() {

  const [ textAreaValue, setTextAreaValue ] = useState('');

  const appController = useAppController();
  const appState = useAppState();
  const roomInfo = useRoomInfo();

  if(appState.subMode !== 'answer-question' || appState.subModeParams == null) {
    return null;
  }
  const questionInfo: QuestionInfo = appState.subModeParams.questionInfo;

  const knownUsers = appState.knownUsers;
  const authorDisplayName = knownUsers[questionInfo.author]?.displayName ?? questionInfo.author;
  const questionTime = questionInfo.questionTimestamp;
  const questionTimeAsDate = questionTime instanceof Date ? questionTime : new Date(questionTime);

  return (
    <Modal className="AnswerQuestion"
           onCancel={() => appController.leaveRoomSubUi()}
    >
      <h1>Reply to Question</h1>
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
      <div className="upvotes-area">
        {questionInfo.upVotes.length} up-vote{questionInfo.upVotes.length !== 1 ? 's' : ''}
      </div>
      <div className="answer-area">
        <textarea className="textentry"
                  onChange={e => setTextAreaValue(e.target.value)}
                  value={textAreaValue}
        />
      </div>
      <div className="buttons-area">
        <button style={{
                  border: "1px solid " + roomInfo.themeColor,
                  background: roomInfo.themeColor,
                }}
                onClick={async () => {
                  await appController.leaveRoomSubUi();
                  await appController.answerQuestion(roomInfo.id, questionInfo.id, textAreaValue);
                }}
        >Submit</button>{' '}
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
