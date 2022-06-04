import {
  ReactNode,
  createContext,
  useContext,
} from "react";
import { AppState, AppStateAction, useAppStateReducer } from "../state";
import { ActionOrFunctionDispatcher } from "../../util/reducerWithThunk";

const AppStateContext = createContext<AppState>(null as any);
const AppStateDispatcherContext = createContext<ActionOrFunctionDispatcher<AppState, AppStateAction>>(null as any);

type Props = {
  children: ReactNode,
}
export function AppStateProviders(props: Props) {
  const [state, appStateDispatcher] = useAppStateReducer();

  return (
    <AppStateDispatcherContext.Provider value={appStateDispatcher}>
      <AppStateContext.Provider value={state}>
        {props.children}
      </AppStateContext.Provider>
    </AppStateDispatcherContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppStateDispatcher() {
  return useContext(AppStateDispatcherContext);
}
