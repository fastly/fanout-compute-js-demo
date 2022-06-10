import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'

import App from './pages/App/App';

import { AppStateProviders } from "./state/components/AppStateProviders";
import { WebSocketProviders } from "./websocket/components/WebSocketProviders";
import { AppControllerProvider } from "./state/components/AppControllerProvider";
import { DemoSessionIdProvider } from "./state/components/DemoSessionIdProvider";
import { StartScreen } from "./pages/StartScreen/StartScreen";
import { Room } from "./pages/Room/Room";

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
        <BrowserRouter>
          <AppStateProviders>
            <AppControllerProvider>
              <Routes>
                <Route path="/" element={<App />}>
                  <Route index element={<StartScreen />}/>
                  <Route path=":roomId" element={<Room />}/>
                </Route>
              </Routes>
            </AppControllerProvider>
          </AppStateProviders>
        </BrowserRouter>
      </WebSocketProviders>
    </DemoSessionIdProvider>
  </React.StrictMode>
);

