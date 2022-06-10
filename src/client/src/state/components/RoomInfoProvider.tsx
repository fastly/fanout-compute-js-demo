import { createContext, ReactNode, useContext, useMemo } from "react";
import { RoomInfo, createRoomInfo } from "../../../../data/src";
import { useAppState } from "./AppStateProviders";

const RoomInfoContext = createContext<RoomInfo>(null as any);

type Props = {
  roomId: string,
  children: ReactNode,
}
export function RoomInfoProvider(props: Props) {
  const appState = useAppState();
  const roomId = props.roomId;

  const roomInfo = useMemo(() => {
    return appState.knownRooms[roomId] ?? createRoomInfo(roomId);
  }, [ roomId, appState.knownRooms ])

  return (
    <RoomInfoContext.Provider value={roomInfo}>
      {props.children}
    </RoomInfoContext.Provider>
  );
}

export function useRoomInfo() {
  return useContext(RoomInfoContext);
}
