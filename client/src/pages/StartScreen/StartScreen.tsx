// The start screen is where you enter your name and
// choose a room to enter

// Or you can create a new room if you are hosting an event

import { useRef, useState } from "react";
import './StartScreen.css';

import { FieldError } from "../../state/state";
import { useAppController } from "../../state/components/AppControllerProvider";
import { useAppState } from "../../state/components/AppStateProviders";
import { CreateRoom } from "../CreateRoom/CreateRoom";

export function StartScreenBody() {
  const formRef = useRef<HTMLFormElement>(null);

  const appController = useAppController();

  const [ userId, setUserId ] = useState('');
  const [ roomId, setRoomId ] = useState('');
  const [ asHost, setAsHost ] = useState(false);

  const [ errors, setErrors ] = useState<FieldError[]>();
  const [ submitting, setSubmitting ] = useState<boolean>(false);

  async function onError(errorItems: FieldError[]) {
    if(errorItems.some(x => x.fieldName === 'roomId' && x.errorCode === 'NOTEXIST')) {
      // We will switch to the Room Creation UI.
      await appController.startRoomCreationUi(userId, roomId);
      return;
    }
    setErrors(errorItems);
  }

  const disableForm = submitting;

  return (
    <div className="StartScreen">
      <div className="main-area">
        <div className="title">
          Welcome to Interactive Audience Questions!
        </div>

        <div className="start-form">
          <div className="start-message">
            It's easy to get started!
          </div>
          <form ref={formRef}
                onSubmit={async (e) => {
                  if(disableForm) {
                    return;
                  }
                  setSubmitting(true);
                  try {
                    e.preventDefault();
                    await appController.enterRoom(userId, roomId, asHost, onError);
                  } finally {
                    setSubmitting(false);
                  }
                }}
          >
            <div className="input-group">
              <label>
                <div className="label-text">
                  Enter your username:
                </div>
                <div>
                  <input className="input-text-field" type="text" value={userId} onChange={e => setUserId(e.target.value)}/>
                </div>
              </label>
            </div>

            <div className="input-group">
              <label>
                <div className="label-text">
                  Enter the ID of the room that you want to join.
                </div>
                <div>
                  <input className="input-text-field" type="text" value={roomId} onChange={e => setRoomId(e.target.value)}/>
                </div>
                <div>
                  <label className="input-checkbox-field"><input type="checkbox" checked={asHost} onChange={e => setAsHost(e.target.checked)} /> Join as Host</label>
                </div>
              </label>
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
              <button type="submit" disabled={disableForm}>Enter Room</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function StartScreen() {
  const appState = useAppState();

  if(appState.subMode === 'room-creation') {
    return (
      <CreateRoom />
    );
  }

  return (
    <StartScreenBody />
  );

}
