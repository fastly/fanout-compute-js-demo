import React, { useMemo } from 'react';
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
  );
}

type Props = {
  hideInfo?: boolean,
};
function App(props: Props) {

  return (
    <div className="App">
      <Outlet />
      {!props.hideInfo ? (
        <Info />
      ) : null}
    </div>
  );
}

export default App;
