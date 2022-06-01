import { useRef, useState } from "react";
import './CreateRoom.css';
import { useAppState } from "../../state/components/AppStateProviders";
import { useAppController } from "../../state/components/AppControllerProvider";
import { FieldError } from "../../state/state";
import { ColorPicker } from "../../components/ColorPicker";
import { THEME_COLORS } from "../../constants";

export function CreateRoom() {

  const appState = useAppState();

  // If we are here we can pretty much assume we are in the right submode
  if(appState.subMode !== 'room-creation') {
    return (<div>Unexpected state: subMode should be room-creation</div>);
  }

  const appController = useAppController();

  const formRef = useRef<HTMLFormElement>(null);

  const userId = appState.subModeParams?.userId ?? ''
  const [ roomId, setRoomId ] = useState(appState.subModeParams?.roomId ?? '');

  const [ haveEditedRoomDisplayName, setHaveEditedRoomDisplayName ] = useState<boolean>(false);
  const [ roomDisplayName, setRoomDisplayName ] = useState('New Room: ' + roomId);
  const [ roomThemeColor, setRoomThemeColor ] = useState('#038cfc');

  const [ errors, setErrors ] = useState<FieldError[]>();
  const [ submitting, setSubmitting ] = useState<boolean>(false);

  function onError(errorItems: FieldError[]) {
    setErrors(errorItems);
  }

  const disableForm = submitting;

  return (
    <div className="CreateRoom">

      <div className="main-area">

        <div className="title">
          Interactive Audience Questions
        </div>

        <div className="form">

          <form ref={formRef}
                onSubmit={async (e) => {
                  if(disableForm) {
                    return;
                  }
                  setSubmitting(true);
                  try {
                    e.preventDefault();
                    await appController.startNewRoom(userId, roomId, roomDisplayName, roomThemeColor, onError);
                  } finally {
                    setSubmitting(false);
                  }
                }}
          >
            <div className="form-message">
              It looks like the room you specified doesn't exist. Let's create it now!
            </div>


            <div className="input-group">
              <label>
                <div className="label-text">
                  ID of the room to create:
                </div>
                <div>
                  <input className="input-text-field" type="text" value={roomId} onChange={e => {
                    setRoomId(e.target.value);
                    if(!haveEditedRoomDisplayName) {
                      setRoomDisplayName('New Room: ' + e.target.value);
                    }
                  }}/>
                </div>
              </label>
            </div>

            <div className="input-group">
              <label>
                <div className="label-text">
                  Pick a friendly name for your room.
                </div>
                <div>
                  <input className="input-text-field" type="text" value={roomDisplayName} onChange={e => {
                    setRoomDisplayName(e.target.value);
                    setHaveEditedRoomDisplayName(true);
                  }}/>
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
              <button type="submit" disabled={disableForm}>Create Room</button>
            </div>

          </form>
        </div>

        <div className="back-label">or</div>

        <div className="back-label">
          <button onClick={async (e) => {
            e.preventDefault();
            await appController.leaveRoomCreationUi();
          }}>Go Back to Previous Screen</button>
        </div>
      </div>

    </div>
  );
}
