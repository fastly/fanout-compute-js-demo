import { useAppController } from "../../state/components/AppControllerProvider";
import { TestOperation } from "../../components/TestOperation";

export function TestActions() {

  const actions = useAppController();

  return (
    <div className="TestActions">
      <h2>Test Actions</h2>

      <div>
        <TestOperation label="Create Room"
                       params={[
                         {paramName: 'userId',},
                         {paramName: 'roomId',},
                         {paramName: 'displayName',},
                         {paramName: 'themeColor',},
                       ]}
                       exec={async (params) => await actions.startNewRoom(params.roomId, params.displayName, params.themeColor)}
        />
      </div>

      <div>
        <TestOperation label="Join Room"
                       params={[
                         {paramName: 'userId',},
                         {paramName: 'roomId',},
                         {paramName: 'asHost', type: 'boolean'},
                       ]}
                       exec={async (params) => await actions.enterRoom(params.roomId)}
        />
      </div>

      <div>
        <TestOperation label="Leave Room"
                       exec={async (params) => actions.leaveRoom()}
        />
      </div>

      <div>
        <TestOperation label="Add/Change Display Name for myself"
                       params={[
                         {paramName: 'displayName',},
                       ]}
                       exec={async (params) => await actions.updateUserInfo({displayName: params.displayName})}
        />
      </div>

      <div>
        <TestOperation label="Add/Change Display Name for room"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'displayName',},
                       ]}
                       exec={async (params) => await actions.updateRoomInfo(params.roomId, {displayName: params.displayName})}
        />
      </div>

      <div>
        <TestOperation label="Change room theme color"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'themeColor',},
                       ]}
                       exec={async (params) => await actions.updateRoomInfo(params.roomId, {themeColor: params.themeColor})}
        />
      </div>

      <div>
        <TestOperation label="Post Question"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'questionText',},
                       ]}
                       exec={async (params) => await actions.postQuestion(params.roomId, params.questionText)}
        />
      </div>

      <div>
        <TestOperation label="Reword Question"
                       params={[
                         {paramName: 'questionId',},
                         {paramName: 'questionText',},
                       ]}
        />
      </div>

      <div>
        <TestOperation label="Answer Question (host)"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'questionId',},
                         {paramName: 'answerText',},
                       ]}
                       exec={async (params) => await actions.answerQuestion(params.roomId, params.questionId, params.answerText)}
        />
      </div>

      <div>
        <TestOperation label="Delete Question (host)"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'questionId',},
                       ]}
                       exec={async (params) => await actions.deleteQuestion(params.roomId, params.questionId)}
        />
      </div>

      <div>
        <TestOperation label="Upvote question"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'questionId',},
                         {paramName: 'removeUpvote', type: 'boolean'}
                       ]}
                       exec={async (params) => { actions.upVoteQuestion(params.roomId, params.questionId, params.removeUpvote); }}
        />
      </div>

      <div>
        <TestOperation label="Passive upvote question"
                       params={[
                         {paramName: 'roomId',},
                         {paramName: 'questionId',},
                         {paramName: 'upVotes', type: 'string'},
                       ]}
                       exec={async (params) => { actions.upVoteQuestionPassive(params.roomId, params.questionId, params.upVotes.split(',').map((x: string)=> x.trim())); }}
        />
      </div>

    </div>
  );

}
