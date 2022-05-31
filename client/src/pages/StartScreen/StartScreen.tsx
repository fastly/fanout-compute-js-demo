// The start screen is where you enter your name and
// choose a room to enter

// Or you can create a new room if you are hosting an event

import { useState } from "react";
import { FieldError } from "../../state/state";
import { useAppController } from "../../state/components/AppControllerProvider";

export function StartScreen() {

  const appController = useAppController();

  const [ userId, setUserId ] = useState('');
  const [ roomId, setRoomId ] = useState('');
  const [ asHost, setAsHost ] = useState(false);

  const [ errors, setErrors ] = useState<FieldError[]>();

  function onError(errorItems: FieldError[]) {
    setErrors(errorItems);
  }

  return (
    <div>
      <div>
        Welcome to Fastlido!
      </div>

      <div>
        Enter your username:
      </div>
      <div>
        Username: <input type="text" value={userId} onChange={e => setUserId(e.target.value)}/>
      </div>

      <div>
        Enter the ID of the room that you want to join.
      </div>
      <div>
        Room ID: <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)}/>
      </div>
      <div>
        <input type="checkbox" checked={asHost} onChange={e => setAsHost(e.target.checked)} /> Join as Host
      </div>

      <div>
        <button onClick={() => appController.testMode()}>Test</button>
        <button onClick={() => appController.enterRoom(userId, roomId, asHost, onError)}>Start</button>
      </div>
    </div>
  );

}
