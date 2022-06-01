import { useState } from "react";

import './TestMode.css';
import { TestApis } from "./TestApis";
import { AppState } from "./AppState";
import { TestActions } from "./TestActions";
import { WebSocketsLog } from "./WebSocketsLog";

export function TestMode() {

  const [ page, setPage ] = useState(0);

  return (
    <div className="TestMode">
      <div className="title">
        <h1>Test Mode</h1>
        <div className="pager">
          <button onClick={() => setPage(x => (x+3) % 4)}>&lt;</button>
          <div className="number">{page + 1}</div>
          <button onClick={() => setPage(x => (x+1) % 4)}>&gt;</button>
        </div>
      </div>
      <div className={"panels active-page-" + page}>
        <AppState />
        <TestActions />
        <WebSocketsLog />
        <TestApis />
      </div>
    </div>
  );

}
