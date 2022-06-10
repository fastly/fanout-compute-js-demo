import React from 'react';
import { Outlet } from 'react-router-dom';
import './App.css';
import { useAppState } from "../../state/components/AppStateProviders";
import { TestMode } from "../TestMode/TestMode";
import { TestModeButton } from "../TestMode/TestModeButton";

function App() {

  const state = useAppState();

  return (
    <div className="App">
      <Outlet />
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
