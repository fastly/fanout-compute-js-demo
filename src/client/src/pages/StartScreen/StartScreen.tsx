// The start screen is where you enter your name and
// choose a room to enter

// Or you can create a new room if you are hosting an event

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './StartScreen.css';

import { useAppController } from "../../state/components/AppControllerProvider";
import { useAppState } from "../../state/components/AppStateProviders";
import { FieldError, validateRoomId, validateUserId } from "../../util/validation";

export function StartScreen() {
  const appController = useAppController();
  const state = useAppState();
  const navigate = useNavigate();

  const [ userId, setUserId ] = useState(state.currentUserId ?? '');
  const [ roomId, setRoomId ] = useState('');
  const [ asHost, setAsHost ] = useState(false);

  const [ errors, setErrors ] = useState<FieldError[]>();
  const [ submitting, setSubmitting ] = useState<boolean>(false);

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
          <form onSubmit={async (e) => {
                  e.preventDefault();
                  if(disableForm) {
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const errors: FieldError[] = [];

                    errors.push(...validateUserId(userId));
                    errors.push(...validateRoomId(roomId));

                    if(errors.length > 0) {
                      setErrors(errors);
                      return;
                    }

                    appController.setUserId(userId, asHost);
                    navigate('./' + roomId);
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

            <div className="input-group">
              <label>
                <div className="label-text">
                  Enter the ID of the room that you want to join.
                </div>
                <div>
                  <input className="input-text-field"
                         type="text"
                         value={roomId}
                         autoCapitalize="off"
                         onChange={e => setRoomId(e.target.value)}
                         onBlur={e => setRoomId(e.target.value.trim().toLowerCase())}
                  />
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
