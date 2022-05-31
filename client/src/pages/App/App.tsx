import React from 'react';
import './App.css';
import { useAppState } from "../../state/components/AppStateProviders";
import { StartScreen } from '../StartScreen/StartScreen';
import { Room } from '../Room/Room';
import { TestMode } from "../TestMode/TestMode";

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

  if(state.test_mode) {
    component = (
      <TestMode />
    );
  }

  return (
    <div className="App">
      {component}
    </div>
  );
}

export default App;
