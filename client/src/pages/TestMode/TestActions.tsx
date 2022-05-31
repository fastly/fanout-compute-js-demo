import { useAppController } from "../../state/components/AppControllerProvider";
import { TestOperation } from "../../components/TestOperation";

export function TestActions() {

  const actions = useAppController();

  return (
    <div className="TestActions">
      <h2>Test Actions</h2>

      <div>
        <TestOperation label="Join Room"
                       params={[
                         {paramName: 'userId',},
                         {paramName: 'roomId',},
                         {paramName: 'asHost', type: 'boolean'},
                       ]}
                       exec={async (params) => await actions.enterRoom(params.userId, params.roomId, params.asHost)}
        />
      </div>

      <div>
        <TestOperation label="Leave Room"
                       exec={async (params) => await actions.leaveRoom()}
        />
      </div>

      <div>
        <TestOperation label="Post Question"
                       params={[
                         {paramName: 'questionText',},
                       ]}
                       exec={async (params) => await actions.postQuestion(params.questionText)}
        />
      </div>

      <div>
        <TestOperation label="Delete Question (host)"
                       params={[
                         {paramName: 'questionId',},
                       ]}
                       exec={async (params) => await actions.deleteQuestion(params.questionId)}
        />
      </div>

      <div>
        <TestOperation label="Upvote question"
                       params={[
                         {paramName: 'questionId',},
                         {paramName: 'removeUpvote', type: 'boolean'}
                       ]}
                       exec={async (params) => { actions.upVoteQuestion(params.questionId, params.removeUpvote); }}
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
