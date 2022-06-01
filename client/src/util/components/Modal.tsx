import { ReactNode } from "react";
import { Portal } from "./Portal";

type ModalProps = {
  children?: ReactNode,
  className?: string,
  id?: string,
  onCancel?: () => void;
}
export function Modal(props: ModalProps) {
  const { className, id, onCancel } = props;
  return (
    <Portal>
      <div onClick={e => {
             e.preventDefault();
             e.stopPropagation();
             if(onCancel != null) {
               onCancel();
             }
           }}
           className="modal-backdrop"
      ></div>
      <div id={id} className={className}>
        {props.children}
      </div>
    </Portal>
  )
}
