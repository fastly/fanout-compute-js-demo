import {
  createContext,
  ReactNode,
  useContext, useEffect,
  useMemo, useRef,
  useState,
} from "react";
import { useForceUpdate } from "../../util/forceUpdate";

export type WebSocketContextValue = {
  getSocket: () => (WebSocket | null);
  open: (url: string) => void;
  close: () => void;
  send: (data: string) => void;
};

const WebSocketLogContext = createContext<string>('');
const WebSocketContext = createContext<WebSocketContextValue>(null as any);

type Props = {
  children: ReactNode,
}
export function WebSocketProviders(props: Props) {
  const webSocketRef = useRef<WebSocket | null>(null);

  const [logContent, setLogContent] = useState('');
  const forceUpdate = useForceUpdate();

  function write(message: string) {
    setLogContent(logContent => logContent + message + '\n');
  }
  function clear(){
    setLogContent(() => '');
  }

  const webSocketContextValue = useMemo(() => {
    return {
      getSocket: () => webSocketRef.current,
      open(url: string) {
        if(webSocketRef.current == null) {
          write('Opening WebSocket to \'' + url + '\'...');
          webSocketRef.current = new WebSocket(url);
          forceUpdate();
        } else {
          write('Attempt to open WebSocket when one already exists.');
        }
      },
      close() {
        if(webSocketRef.current != null) {
          write('Closing WebSocket to \'' + webSocketRef.current.url + '\'...');
          webSocketRef.current.close();
          webSocketRef.current = null;
          forceUpdate();
        } else {
          write('Attempt to close non-open WebSocket.');
        }
      },
      send(message: string) {
        if(webSocketRef.current != null) {
          write('Sending message \'' + message + '\'.');
          webSocketRef.current.send(message);
        } else {
          write('Attempt to send to non-open WebSocket.');
        }
      }
    }
  }, [webSocketRef]);

  useEffect(() => {
    if(webSocketRef.current != null) {
      webSocketRef.current.addEventListener('open', (e) => {
        write('> WebSocket opened');
      });
      webSocketRef.current.addEventListener('close', (e) => {
        write('> WebSocket closed: ' + JSON.stringify({code: e.code, reason: e.reason, wasClean: e.wasClean}));
      });
      webSocketRef.current.addEventListener('message', (e) => {
        write('> ' + e.data);
      });
      webSocketRef.current.addEventListener('error', (e) => {
        write('> WebSocket error.');
      });
    }
  }, [webSocketRef.current])

  return (
    <WebSocketLogContext.Provider value={logContent}>
      <WebSocketContext.Provider value={webSocketContextValue}>
        {props.children}
      </WebSocketContext.Provider>
    </WebSocketLogContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function useWebSocketLog() {
  return useContext(WebSocketLogContext);
}
