import { ReactNode, useEffect, useRef, } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import './Room.css';
import { UserInfo } from "../../../../data/src";
import { useAppState } from "../../state/components/AppStateProviders";
import { useAppController } from "../../state/components/AppControllerProvider";
import { useDemoSessionId } from "../../state/components/DemoSessionIdProvider";
import { RoomInfoProvider, useRoomInfo } from "../../state/components/RoomInfoProvider";
import { QuestionsPanel } from "../../components/QuestionsPanel";
import { EditUserDetails } from "../../components/EditUserDetails";
import { EditRoomDetails } from "../../components/EditRoomDetails";
import { AnswerQuestion } from "../../components/AnswerQuestion";
import { DeleteQuestion } from "../../components/DeleteQuestion";
import { CreateRoom } from "../../components/CreateRoom";
import { EnterUserInfo } from "../../components/EnterUserInfo";
import { WEBSOCKET_URL_BASE } from "../../constants";

type TitleBarProps = {
  userId: string | null;
  userInfo: UserInfo | null;
  isHost: boolean;
  onExitButton: () => void;
}
function TitleBar(props: TitleBarProps) {

  const actions = useAppController();
  const roomInfo = useRoomInfo();

  const { userId, userInfo, isHost } = props;

  return (
    <div className="title-bar"
         style={{
           borderBottomColor: roomInfo.themeColor,
         }}
    >
      <div className="spacer exit-section">
        <button className="exit-button" onClick={props.onExitButton}><span className="material-icons">navigate_before</span><div className="exit-text">Exit</div></button>
      </div>
      <div className="room-name-section">
        <div className="spacer"></div>
        <div className="display-name"
             style={{
               color: roomInfo.themeColor,
             }}
        >
          {roomInfo.displayName}
        </div>
        <div className={"spacer " + (isHost ? " edit-button" : "")}>
          {isHost ? (
            <button onClick={() => {
              actions.enterRoomDetailsUi();
            }}><span className="material-icons">edit</span></button>
          ) : null}
        </div>
      </div>
      <div className="spacer user-name-section">
        {userId != null ? (
          <>
            <div className="username"
                 onClick={() => {
                   actions.enterUserDetailsUi(userId);
                 }}
            >
              {userInfo != null ? userInfo.displayName : userId}
            </div>
            <button onClick={() => {
              actions.enterUserDetailsUi(userId);
            }}><span className="material-icons">expand_more</span></button>
          </>
        ) : (
          <div>
            No User
          </div>
        )}
      </div>
    </div>
  );

}

function QuestionsArea() {

  const roomInfo = useRoomInfo();

  const backgroundString =
    `linear-gradient(0deg, ${roomInfo.themeColor} 0%, rgba(255, 255, 255,1) 50%)`;

  return (
    <div className="questions-area"
         style={{background: backgroundString}}
    >
      <QuestionsPanel />
    </div>
  );

}


export function Room() {

  const webSocketRef = useRef<WebSocket | null>();

  // Landing in this room will cause us to switch to the room if
  // we aren't already in there.
  const navigate = useNavigate();
  const params = useParams();
  const roomId: string = params.roomId!;

  const appController = useAppController();
  const appState = useAppState();
  const sessionId = useDemoSessionId();

  // connect the websocket
  useEffect(() => {
    const url = WEBSOCKET_URL_BASE + '?roomId=' + roomId + (sessionId !== '' ? '&session=' + sessionId : '');
    console.log('Opening websocket to ' + url);
    const webSocket = new WebSocket(url);
    webSocket.addEventListener('message', (e) => {
      let data: any;
      try {
        data = JSON.parse(e.data);
      } catch {
        console.warn('non-JSON payload, not sure what to do, ignoring', e.data);
        return;
      }
      appController.passiveUpdate(data);
    });
    webSocket.addEventListener('open', () => {
      console.log('Websocket opened.');
      webSocketRef.current = webSocket;
    });
    return () => {
      console.log('Closing websocket.');
      webSocket.close();
      webSocketRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    console.log('Entering room');
    let cancelEffect = false;
    (async () => {
      await appController.enterRoom(
        roomId,
        (result) => {
          if(cancelEffect) {
            // effect has been canceled, do nothing
            console.log("Effect canceled, do nothing");
            return false;
          }
          if(result === false) {
            // We've clicked the cancel link in the "create room" modal
            navigate('../');
            return false;
          }
          return true;
        },
        (result) => {
          if(cancelEffect) {
            // effect has been canceled, do nothing
            console.log("Effect canceled, do nothing");
            return false;
          }
          if(result === false) {
            // We've clicked the cancel link in the "enter username" modal
            navigate('../');
            return false;
          }
          return true;
        }
      );
    })();

    return () => {
      console.log('Leaving room');
      cancelEffect = true;
      appController.cancelCreateRoomUi();
      appController.cancelEnterUserInfoUi();
      appController.leaveRoom();
    };
  }, [roomId]);

  let subComponent: ReactNode | null = null;

  if (appState.subMode === 'create-room') {
    subComponent = (
      <CreateRoom
        onSubmit={(roomDisplayName, roomThemeColor, userId) => {
          appController.submitCreateRoomUi(roomDisplayName, roomThemeColor, userId);
        }}
        onCancel={() => {
          appController.cancelCreateRoomUi();
        }}
      />
    );
  } else if (appState.subMode === 'enter-user-info') {
    subComponent = (
      <EnterUserInfo
        onSubmit={(userId, asHost) => {
          appController.submitEnterUserInfoUi(userId, asHost);
        }}
        onCancel={() => {
          appController.cancelEnterUserInfoUi();
        }}
      />
    );
  } else if (appState.subMode === 'edit-user-details') {
    subComponent = (
      <EditUserDetails />
    );
  } else if (appState.subMode === 'edit-room-details') {
    subComponent = (
      <EditRoomDetails />
    );
  } else if (appState.subMode === 'answer-question') {
    subComponent = (
      <AnswerQuestion />
    );
  } else if (appState.subMode === 'delete-question') {
    subComponent = (
      <DeleteQuestion />
    );
  }

  return (
    <RoomInfoProvider roomId={roomId}>
      <div className="Room">
        <TitleBar userId={appState.currentUserId}
                  userInfo={appState.currentUserId != null ? appState.knownUsers[appState.currentUserId] : null}
                  isHost={appState.isHost}
                  onExitButton={() => { navigate('../'); }}
        />
        <QuestionsArea />
        {subComponent}
      </div>
    </RoomInfoProvider>
  );

}
