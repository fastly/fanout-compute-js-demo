import React from 'react';
import './App.css';
import { useAppState } from "../../state/components/AppStateProviders";
import { StartScreen } from '../StartScreen/StartScreen';
import { Room } from '../Room/Room';
import { TestMode } from "../TestMode/TestMode";
import { TestModeButton } from "../TestMode/TestModeButton";

function App() {

  const state = useAppState();

  let component = null;
  switch(state.mode) {
    case 'start':
      component = (
        <StartScreen />
      );
      break;
    case 'room':
      component = (
        <Room />
      );
      break;
    default:
      component = (
        <div>{state.mode}</div>
      );
  }

  return (
    <div className="App">
      {component}
      {state.test_mode ? (
        <TestMode />
      ) : null}
      {state.test_mode_button ? (
        <TestModeButton />
      ) : null}
    </div>
  );
}

export default App;
