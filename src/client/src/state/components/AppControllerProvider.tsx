import { createContext, ReactNode, useContext, useMemo } from "react";
import { useAppStateDispatcher } from "./AppStateProviders";
import { AppController } from "../appController";

const AppControllerContext = createContext<AppController>(null as any);

type Props = {
  children: ReactNode,
}
export function AppControllerProvider(props: Props) {
  const dispatch = useAppStateDispatcher();

  const appController = useMemo(() => {
    return new AppController(dispatch);
  }, []);

  return (
    <AppControllerContext.Provider value={appController}>
      {props.children}
    </AppControllerContext.Provider>
  );

}

export function useAppController() {
  return useContext(AppControllerContext);
}
