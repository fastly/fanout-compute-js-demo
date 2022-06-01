import './EditUserDetails.css';
import { Modal } from "../util/components/Modal";
import { useAppState } from "../state/components/AppStateProviders";
import { RoomInfo } from "../../../data/src";
import { useAppController } from "../state/components/AppControllerProvider";
import { useState } from "react";

export function EditUserDetails() {

  const appController = useAppController();
  const appState = useAppState();
  if(appState.subMode !== 'edit-user-details' || appState.subModeParams == null) {
    return null;
  }
  const roomInfo: RoomInfo = appState.subModeParams.roomInfo;
  const userId: string = appState.subModeParams.userId;

  const knownUsers = appState.knownUsers;
  const defaultDisplayName = knownUsers[userId]?.displayName ?? userId;

  const [ displayName, setDisplayName ] = useState(defaultDisplayName);

  return (
    <Modal className="EditUserDetails"
           onCancel={() => appController.leaveRoomSubUi()}
    >
      <h1>Edit User Details</h1>

      <div className="input-group">
        <label>
          <div className="label-text">
            Pick a friendly name for your user.
          </div>
          <div>
            <input className="input-text-field" type="text" value={displayName} onChange={e => {
              setDisplayName(e.target.value);
            }}/>
          </div>
        </label>
      </div>

      <div className="buttons-area">
        <button style={{
                  border: "1px solid " + roomInfo.themeColor,
                  background: roomInfo.themeColor,
                }}
                onClick={async () => {
                  await appController.leaveRoomSubUi();
                  await appController.updateUserInfo({displayName});
                }}
        >Update</button>{' '}
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
