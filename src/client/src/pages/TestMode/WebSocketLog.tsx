import { useLog } from "../../websocket/components/LogProviders";

export function WebSocketLog() {

  const logs = useLog('websocket');

  return (
    <div className="WebSocketsLog">
      <h2>WebSocket Log</h2>
      <pre>
        {logs}
      </pre>
    </div>
  );
}
