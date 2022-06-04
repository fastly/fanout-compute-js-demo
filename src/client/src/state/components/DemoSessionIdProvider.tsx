import { createContext, ReactNode, useContext } from "react";

const DemoSessionIdContext = createContext<string>(null as any);

type Props = {
  sessionId: string,
  children: ReactNode,
};
export function DemoSessionIdProvider(props: Props) {
  return (
    <DemoSessionIdContext.Provider value={props.sessionId}>
      {props.children}
    </DemoSessionIdContext.Provider>
  );
}

export function useDemoSessionId() {
  return useContext(DemoSessionIdContext);
}
