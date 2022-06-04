import './TestModeButton.css';
import { useAppController } from "../../state/components/AppControllerProvider";
import { useAppState } from "../../state/components/AppStateProviders";

export function TestModeButton() {

  const state = useAppState();
  const actions = useAppController();

  return (
    <div className="TestModeButton">
      <button onClick={() => actions.testMode(!state.test_mode)}>Test Mode</button>
    </div>
  );

}
