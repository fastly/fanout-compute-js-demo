import { TestOperation } from "../../components/TestOperation";
import { instance as apiServerInstance } from "../../services/ApiServer";
import { instance as persistenceApiServerInstance } from "../../services/PersistenceApiServer";
import { useState } from "react";
import { PersistenceApiServer } from "../../services/PersistenceApiServer";

export function TestApis() {

  const [ apiMode, setApiMode ] = useState('api');

  const instance = apiMode === 'api' ? apiServerInstance : persistenceApiServerInstance;

  return (
    <div className="TestApis">
      <h2>Test APIs <select value={apiMode} onChange={e => setApiMode(e.target.value)}><option value='api'>Edge API</option><option value='persistence'>Persistence API (debug)</option></select></h2>
      <div>
        <TestOperation label="getSubs"
                       params={[
                         {paramName: 'channel',},
                       ]}
                       exec={async (params) => await instance.getSubs(params.channel)}
        />

        <TestOperation label="getKnownUsers"
                       exec={async () => await instance.getKnownUsers()}
        />
        <TestOperation label="getUserInfo"
                       params={[
                         {paramName: 'userId',},
                       ]}
                       exec={async (params) => await instance.getUserInfo(params.userId)}
        />
        <TestOperation label="getKnownRooms"
                       exec={async () => await instance.getKnownRooms()}
        />
        <TestOperation label="getRoomInfo"
                       params={[
                         {paramName: 'roomId',},
                       ]}
                       exec={async (params) => await instance.getRoomInfo(params.roomId)}
        />

        {instance instanceof PersistenceApiServer ? (
          <TestOperation label="createRoom"
                         params={[
                           {paramName: 'roomId',},
                         ]}
                         exec={async (params) => await instance.createRoom(params.roomId)}
          />
        ) : null}

        <TestOperation label="getQuestionsForRoom"
                       params={[
                         {paramName: 'roomId',},
                       ]}
                       exec={async (params) => await instance.getQuestionsForRoom(params.roomId)}
        />

        <TestOperation label="getFullRoomInfo"
                       params={[
                         {paramName: 'roomId',},
                       ]}
                       exec={async (params) => await instance.getFullRoomInfo(params.roomId)}
        />

        {instance instanceof PersistenceApiServer ? (
          <TestOperation label="addQuestionToRoom"
                         params={[
                           {paramName: 'roomId',},
                           {paramName: 'userId',},
                           {paramName: 'questionId',},
                           {paramName: 'questionText',},
                         ]}
                         exec={async (params) => await instance.addQuestionToRoom(params.roomId, params.userId, params.questionId, params.questionText)}
          />
        ) : null}
        {instance instanceof PersistenceApiServer ? (
          <TestOperation label="upVoteQuestion"
                         params={[
                           {paramName: 'roomId',},
                           {paramName: 'userId',},
                           {paramName: 'questionId',},
                           {paramName: 'removeUpvote', type: 'boolean'},
                         ]}
                         exec={async (params) => await instance.upVoteQuestion(params.roomId, params.userId, params.questionId, params.removeUpvote)}
          />
        ) : null}

      </div>
    </div>
  );

}
