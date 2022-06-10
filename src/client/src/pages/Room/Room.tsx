import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import './Room.css';
import { useAppState } from "../../state/components/AppStateProviders";
import { RoomInfo, UserInfo } from "../../../../data/src";
import { useAppController } from "../../state/components/AppControllerProvider";
import { RoomInfoProvider, useRoomInfo } from "../../state/components/RoomInfoProvider";
import { QuestionsPanel } from "../../components/QuestionsPanel";
import { EditUserDetails } from "../../components/EditUserDetails";
import { EditRoomDetails } from "../../components/EditRoomDetails";
import { AnswerQuestion } from "../../components/AnswerQuestion";
import { DeleteQuestion } from "../../components/DeleteQuestion";

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

  // Landing in this room will cause us to switch to the room if
  // we aren't already in there.
  const navigate = useNavigate();
  const params = useParams();
  const roomId: string = params.roomId!;

  const appController = useAppController();
  const appState = useAppState();

  const [ landing, setLanding ] = useState(false);

  useEffect(() => {
    // land in room
    // 1. enter the room
    // room does not exist -> 2.
    // room exists -> 4.
    // 2. open create room box
    // 3. accept user, room ID
    // create the room
    // enter the room -> 4.
    // 4. open websocket
    // 5. do we have a current user?
    // no -> 6.
    // yes -> 7.
    // 6. open enter name box
    // 7. people can use the UI
    if(landing) {
      console.log('ss return');
      return;
    }
    (async () => {
      setLanding(true);
      console.log('Attempting to land in room', roomId);
      try {
        //await appController.enterRoom(roomId);
        // If we get this far, we should now have a websocket
        if(appState.currentUserId != null) {
          console.log('user exists', appState.currentUserId);
        } else {
          console.log('no user');
        }
      } catch(ex) {
        if(ex === 'NOTEXIST') {
          console.log('room not exist');
        }
      } finally {
        setLanding(false);
      }
    })();

    return () => {
      console.log('Leaving room');
      //appController.leaveRoom();
    };
  }, [roomId]);

  if(appState.currentRoomId == null) {
    return null;
  }

  let subComponent: ReactNode | null = null;
  if (appState.subMode === 'edit-user-details') {
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
