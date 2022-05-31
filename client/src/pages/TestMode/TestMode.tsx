import './TestMode.css';
import { TestApis } from "./TestApis";
import { AppState } from "./AppState";
import { TestActions } from "./TestActions";
import { WebSocketsLog } from "./WebSocketsLog";

export function TestMode() {

  return (
    <div className="TestMode">
      <AppState />
      <TestActions />
      <WebSocketsLog />
      <TestApis />
    </div>
  );

}
