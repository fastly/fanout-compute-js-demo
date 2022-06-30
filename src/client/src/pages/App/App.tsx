import React from 'react';
import { Outlet } from 'react-router-dom';
import './App.css';

function Info() {
  return (
    <div className="Info">
      <div>
        <a target="_blank" href="https://developer.fastly.com/solutions/demos/realtimeqa-websockets/">Read here</a> about this demo!
      </div>
      <div>
        Source code <a target="_blank" href="https://github.com/fastly/fanout-compute-js-demo">on GitHub</a>.
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="App">
      <Outlet />
      <Info />
    </div>
  );
}

export default App;
