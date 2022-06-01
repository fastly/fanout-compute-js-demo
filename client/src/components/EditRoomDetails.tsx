import './EditRoomDetails.css';
import { Modal } from "../util/components/Modal";
import { useAppState } from "../state/components/AppStateProviders";
import { RoomInfo } from "../../../data/src";
import { useAppController } from "../state/components/AppControllerProvider";
import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { THEME_COLORS } from "../constants";

export function EditRoomDetails() {

  const appController = useAppController();
  const appState = useAppState();
  if(appState.subMode !== 'edit-room-details' || appState.subModeParams == null) {
    return null;
  }
  const roomInfo: RoomInfo = appState.subModeParams.roomInfo;

  const [ displayName, setDisplayName ] = useState(roomInfo.displayName);
  const [ themeColor, setThemeColor ] = useState(roomInfo.themeColor);

  return (
    <Modal className="EditRoomDetails"
           onCancel={() => appController.leaveRoomSubUi()}
    >
      <h1>Edit Room Details</h1>

      <div className="input-group">
        <label>
          <div className="label-text">
            Pick a friendly name for your room.
          </div>
          <div>
            <input className="input-text-field" type="text" value={displayName} onChange={e => {
              setDisplayName(e.target.value);
            }}/>
          </div>
        </label>
      </div>

      <div className="input-group">
        <div className="label-text">
          Pick a theme color for your room.
        </div>
        <div>
          <ColorPicker choices={THEME_COLORS} size="40px" value={themeColor} onChange={(value) => setThemeColor(value)}/>
        </div>
      </div>

      <div className="buttons-area">
        <button style={{
                  border: "1px solid " + roomInfo.themeColor,
                  background: roomInfo.themeColor,
                }}
                onClick={async () => {
                  await appController.leaveRoomSubUi();
                  await appController.updateRoomInfo({displayName, themeColor});
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
