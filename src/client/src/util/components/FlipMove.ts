import { createElement, ReactNode } from "react";
import { default as FlipMoveOrig } from "react-flip-move";

type FlipMoveOrigProps = FlipMoveOrig.FlipMoveProps;

type FlipMoveProps = FlipMoveOrigProps & {
  children: ReactNode
}
export default function FlipMove(props: FlipMoveProps) {

  const { children, ...restProps } = props;
  return createElement(FlipMoveOrig, restProps, children);

}
