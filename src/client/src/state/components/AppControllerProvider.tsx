import { createContext, ReactNode, useContext, useMemo } from "react";
import { useWebSocket, } from "../../websocket/components/WebSocketProviders";
import { useAppStateDispatcher } from "./AppStateProviders";
import { AppController } from "../appController";
import { useDemoSessionId } from "./DemoSessionIdProvider";

const AppControllerContext = createContext<AppController>(null as any);

type Props = {
  children: ReactNode,
}
export function AppControllerProvider(props: Props) {
  const wsContext = useWebSocket();
  const dispatch = useAppStateDispatcher();
  const sessionId = useDemoSessionId();

  const appController = useMemo(() => {
    return new AppController(dispatch, wsContext, sessionId);
  }, [wsContext]);

  return (
    <AppControllerContext.Provider value={appController}>
      {props.children}
    </AppControllerContext.Provider>
  );

}

export function useAppController() {
  return useContext(AppControllerContext);
}
