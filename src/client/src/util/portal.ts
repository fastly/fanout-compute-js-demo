import { useEffect, useMemo, useRef } from "react";

export function usePortal(parentNode: HTMLElement) {
  const portalRoot = useRef<HTMLDivElement>();

  const portalRootValue = useMemo(() => {
    if(portalRoot.current == null) {
      portalRoot.current = document.createElement('div');
    }
    return portalRoot.current;
  }, [portalRoot]);

  useEffect(() => {
    parentNode.appendChild(portalRootValue);
    return () => {
      portalRootValue.remove();
    };
  }, [parentNode]);

  return portalRootValue;
}
