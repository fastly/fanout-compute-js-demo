import { useAppState } from "../../state/components/AppStateProviders";

export function Room() {

  const appState = useAppState();

  return (
    <div>
      {appState.mode}
    </div>
  );

}
