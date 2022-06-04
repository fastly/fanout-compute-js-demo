import { useAppState } from "../../state/components/AppStateProviders";

export function AppState() {

  const appState = useAppState();

  return (
    <div className="AppState">
      <h2>App State</h2>
      <pre>
        {JSON.stringify(appState, undefined, 2)}
      </pre>
    </div>


  );
}
