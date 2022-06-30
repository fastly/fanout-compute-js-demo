import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'

import App from './pages/App/App';

import { AppStateProviders } from "./state/components/AppStateProviders";
import { LogProviders } from "./websocket/components/LogProviders";
import { AppControllerProvider } from "./state/components/AppControllerProvider";
import { DemoSessionIdProvider } from "./state/components/DemoSessionIdProvider";
import { StartScreen } from "./pages/StartScreen/StartScreen";
import { Room } from "./pages/Room/Room";

const params = (new URL(document.location.toString())).searchParams;

// use "session" from query parameter
const sessionId = params.get("session") ?? '';

// use "hideInfo" from query parameter
const hideInfo = params.get("hideInfo") === 'yes';
console.log('hideInfo', hideInfo);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <DemoSessionIdProvider sessionId={sessionId}>
      <LogProviders>
        <BrowserRouter>
          <AppStateProviders>
            <AppControllerProvider>
              <Routes>
                <Route path="/" element={<App hideInfo={hideInfo} />}>
                  <Route index element={<StartScreen />}/>
                  <Route path=":roomId" element={<Room />}/>
                </Route>
              </Routes>
            </AppControllerProvider>
          </AppStateProviders>
        </BrowserRouter>
      </LogProviders>
    </DemoSessionIdProvider>
  </React.StrictMode>
);

