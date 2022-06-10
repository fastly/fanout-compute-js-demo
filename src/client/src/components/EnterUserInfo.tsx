import { useState } from "react";
import './EnterUserInfo.css';
import { Modal } from "../util/components/Modal";
import { useAppState } from "../state/components/AppStateProviders";
import { useRoomInfo } from "../state/components/RoomInfoProvider";
import { FieldError, validateUserId } from "../util/validation";

type Props = {
  onSubmit: (userId: string, asHost: boolean) => void,
  onCancel: () => void,
};
export function EnterUserInfo(props: Props) {

  const appState = useAppState();
  const roomInfo = useRoomInfo();

  if(appState.subMode !== 'enter-user-info') {
    return null;
  }

  const [ userId, setUserId ] = useState(appState.currentUserId ?? '');
  const [ asHost, setAsHost ] = useState(false);

  const [ errors, setErrors ] = useState<FieldError[]>();
  const [ submitting, setSubmitting ] = useState<boolean>(false);

  return (
    <Modal className="EnterUserInfo">
      <div className="main-area">

        <div className="title">
          Welcome to <span className="room-name">{roomInfo.displayName}</span>!
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

                errors.push(...validateUserId(userId));

                if(errors.length > 0) {
                  setErrors(errors);
                  return;
                }

                props.onSubmit(userId, asHost);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="form-message">
              You need to pick a username to use this app.
            </div>

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
              <label className="input-checkbox-field"><input type="checkbox" checked={asHost} onChange={e => setAsHost(e.target.checked)} /> Join as Host</label>
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
              <button type="submit" disabled={submitting}>Submit</button>
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
