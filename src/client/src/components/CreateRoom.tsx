import './CreateRoom.css';
import { useAppState } from "../state/components/AppStateProviders";
import { Modal } from "../util/components/Modal";
import { FieldError, validateRoomId, validateUserId } from "../util/validation";
import { ColorPicker } from "./ColorPicker";
import { THEME_COLORS } from "../constants";
import { useState } from "react";

type Props = {
  onSubmit: (roomDisplayName: string, roomThemeColor: string, userId?: string) => void,
  onCancel: () => void,
};
export function CreateRoom(props: Props) {

  const appState = useAppState();

  // If we are here we can pretty much assume we are in the right submode
  if(appState.subMode !== 'create-room' || appState.subModeParams == null) {
    return (<div>Unexpected state</div>);
  }

  const roomId: string = appState.subModeParams.roomId;
  const [ roomDisplayName, setRoomDisplayName ] = useState('New Room: ' + roomId);
  const [ roomThemeColor, setRoomThemeColor ] = useState('#038cfc');

  let useUserIdInput = appState.currentUserId == null;
  const [ userId, setUserId ] = useState(appState.currentUserId ?? '');

  const [ errors, setErrors ] = useState<FieldError[]>();
  const [ submitting, setSubmitting ] = useState<boolean>(false);

  return (
    <Modal className="CreateRoom">
      <div className="main-area">

        <div className="title">
          New Room
        </div>

        <div className="form">

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if(submitting) {
                return;
              }
              setSubmitting(true);
              try {
                const errors: FieldError[] = [];

                if(useUserIdInput) {
                  errors.push(...validateUserId(userId));
                }

                if(errors.length > 0) {
                  setErrors(errors);
                  return;
                }

                props.onSubmit(roomDisplayName, roomThemeColor, useUserIdInput ? userId : undefined);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="form-message">
              It looks like the room you specified doesn't exist. Let's create it now!
            </div>

            <div className="input-group">
              <div className="label-text">
                ID of the room to create: <span className="room-id">{roomId}</span>
              </div>
            </div>

            {useUserIdInput ? (
              <div className="input-group">
                <label>
                  <div className="label-text">
                    Enter your username:
                  </div>
                  <div>
                    <input className="input-text-field"
                           type="text"
                           value={userId}
                           autoCapitalize="off"
                           onChange={e => setUserId(e.target.value)}
                           onBlur={e => setUserId(e.target.value.trim().toLowerCase())}
                    />
                  </div>
                </label>
              </div>
            ) : null}

            <div className="input-group">
              <label>
                <div className="label-text">
                  Pick a friendly name for your room.
                </div>
                <div>
                  <input className="input-text-field"
                         type="text"
                         value={roomDisplayName}
                         onChange={e => {
                           setRoomDisplayName(e.target.value);
                         }}
                  />
                </div>
              </label>
            </div>

            <div className="input-group">
              <div className="label-text">
                Pick a theme color for your room.
              </div>
              <div>
                <ColorPicker choices={THEME_COLORS} size="60px" value={roomThemeColor} onChange={(value) => setRoomThemeColor(value)}/>
              </div>
            </div>

            {errors != null && errors.length > 0 ? (
              <div className="error-group">
                {errors.map((e, i) => (
                  <div key={i}>
                    * {e.errorDescription}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="submit-button-group">
              <button type="submit" disabled={submitting}>Create Room</button>
            </div>

          </form>
        </div>

        <div className="back-label">or</div>

        <div className="back-label">
          <button onClick={async (e) => {
            e.preventDefault();
            props.onCancel();
          }}>Return to Top</button>
        </div>
      </div>
    </Modal>
  );
}
