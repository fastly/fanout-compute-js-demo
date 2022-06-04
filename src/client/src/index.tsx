import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import App from './pages/App/App';

import { AppStateProviders } from "./state/components/AppStateProviders";
import { WebSocketProviders } from "./websocket/components/WebSocketProviders";
import { AppControllerProvider } from "./state/components/AppControllerProvider";
import { DemoSessionIdProvider } from "./state/components/DemoSessionIdProvider";

// use "session" from query parameter
let params = (new URL(document.location.toString())).searchParams;
let sessionId = params.get("session") ?? '';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <DemoSessionIdProvider sessionId={sessionId}>
      <WebSocketProviders>
        <AppStateProviders>
          <AppControllerProvider>
            <App />
          </AppControllerProvider>
        </AppStateProviders>
      </WebSocketProviders>
    </DemoSessionIdProvider>
  </React.StrictMode>
);

