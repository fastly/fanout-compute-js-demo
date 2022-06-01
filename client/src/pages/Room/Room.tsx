import './Room.css';
import { useAppState } from "../../state/components/AppStateProviders";
import { RoomInfo, UserInfo } from "../../../../data/src";
import { useAppController } from "../../state/components/AppControllerProvider";
import { QuestionsPanel } from "../../components/QuestionsPanel";

type TitleBarProps = {
  userId: string;
  roomInfo: RoomInfo;
  userInfo?: UserInfo;
  isHost: boolean;
}
function TitleBar(props: TitleBarProps) {

  const actions = useAppController();

  const { roomInfo, userId, userInfo, isHost } = props;

  return (
    <div className="title-bar"
         style={{
           borderBottomColor: roomInfo.themeColor,
         }}
    >
      <div className="spacer exit-section">
        <button className="exit-button"
                onClick={() => actions.leaveRoom()}
        ><span className="material-icons">navigate_before</span><div className="exit-text">Exit</div></button>
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
            <button><span className="material-icons">edit</span></button>
          ) : null}
        </div>
      </div>
      <div className="spacer user-name-section">
        <div className="username">{userInfo != null ? userInfo.displayName : userId}</div>
        <button><span className="material-icons">expand_more</span></button>
      </div>
    </div>
  );

}

type QuestionsAreaProps = {
  roomInfo: RoomInfo;
}
function QuestionsArea(props: QuestionsAreaProps) {

  const { roomInfo } = props;

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

  const appState = useAppState();

  if(appState.currentUserId == null || appState.currentRoomId == null) {
    return null;
  }

  return (
    <div className="Room">
      <TitleBar userId={appState.currentUserId}
                roomInfo={appState.knownRooms[appState.currentRoomId]}
                userInfo={appState.knownUsers[appState.currentUserId]}
                isHost={appState.isHost}
      />
      <QuestionsArea roomInfo={appState.knownRooms[appState.currentRoomId]} />
    </div>
  );

}
