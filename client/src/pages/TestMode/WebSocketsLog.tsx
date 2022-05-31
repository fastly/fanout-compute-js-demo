import { useWebSocketLog } from "../../websocket/components/WebSocketProviders";

export function WebSocketsLog() {

  const logs = useWebSocketLog();

  return (
    <div className="WebSocketsLog">
      <h2>WebSockets Log</h2>
      <pre>
        {logs}
      </pre>
    </div>
  );
}
