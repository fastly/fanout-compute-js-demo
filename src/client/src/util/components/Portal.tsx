import { ReactNode } from "react";
import { usePortal } from "../portal";
import { createPortal } from "react-dom";

type PortalProps = {
  children: ReactNode,
}
export function Portal(props: PortalProps) {
  const target = usePortal(document.body);
  return createPortal(props.children, target);
}
