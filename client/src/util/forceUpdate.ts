import { useCallback, useState } from "react";

export function useForceUpdate() {
  const [,setDummyState] = useState({});
  return useCallback(() => setDummyState({}), []);
}
