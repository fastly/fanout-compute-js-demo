import { Reducer, ReducerAction, ReducerState, useCallback, useReducer, useRef } from "react";

type DispatchFunction<TState, TAction> = (dispatch: ActionOrFunctionDispatcher<TState, TAction>, getState: () => TState) => void;
type ActionOrFunction<TState, TAction> = TAction | DispatchFunction<TState, TAction>;
export type ActionOrFunctionDispatcher<TState, TAction> = (actionOrFunction: ActionOrFunction<TState, TAction>) => void | Promise<any>;

export function useReducerWithThunk<
  TReducer extends Reducer<any, any>
>(reducer: TReducer, initialState: ReducerState<TReducer>): [
  ReducerState<TReducer>,
  ActionOrFunctionDispatcher<ReducerState<TReducer>, ReducerAction<TReducer>>
] {
  const lastState = useRef(initialState);
  const getState = useCallback(() => lastState.current, []);
  const callReducer = useCallback((state: ReducerState<TReducer>, action: ReducerAction<TReducer>) => {
    const newState = reducer(state, action);
    lastState.current = newState;
    return newState;
  }, [reducer]);

  const [state, dispatch] = useReducer(callReducer, initialState);

  const dispatchWithThunk = useCallback((actionOrFunction: ActionOrFunction<any, any>): void | Promise<any> => {
    if(typeof actionOrFunction === 'function') {
      return Promise.resolve()
        .then(() => {
          return actionOrFunction(dispatchWithThunk, getState);
        });
    } else {
      dispatch(actionOrFunction);
    }
  }, [dispatch]);

  return [state, dispatchWithThunk];
}
