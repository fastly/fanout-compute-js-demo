import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useForceUpdate } from "../../util/forceUpdate";

export type LogWriter = (message: string) => void;
export type LogWriterFactory = (logName: string) => LogWriter;

const LogContext = createContext<Map<string, string>>(null as any);
const LogWriterContext = createContext<LogWriterFactory>(null as any);

type Props = {
  children: ReactNode,
}
export function LogProviders(props: Props) {

  const logContextValue = useRef(new Map<string, string>());
  const forceUpdate = useForceUpdate();

  const logWriterContextValue: LogWriterFactory = useMemo(() => {
    return (logName: string) => {
      return (message: string) => {
        let logContent = logContextValue.current.get(logName) ?? '';
        logContent = logContent + message + '\n';
        logContextValue.current.set(logName, logContent);
        forceUpdate();
      };
    };
  }, [logContextValue]);

  return (
    <LogContext.Provider value={logContextValue.current}>
      <LogWriterContext.Provider value={logWriterContextValue}>
        {props.children}
      </LogWriterContext.Provider>
    </LogContext.Provider>
  );
}

export function useLog(logName: string) {
  const ctx = useContext(LogContext);
  return ctx.get(logName) ?? '';
}

export function useLogWriter(logName: string): LogWriter {
  const ctx = useContext(LogWriterContext);
  return ctx(logName);
}
