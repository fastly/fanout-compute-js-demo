import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import App from './pages/App/App';

import { AppStateProviders } from "./state/components/AppStateProviders";
import { WebSocketProviders } from "./websocket/components/WebSocketProviders";
import { AppControllerProvider } from "./state/components/AppControllerProvider";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <WebSocketProviders>
      <AppStateProviders>
        <AppControllerProvider>
          <App />
        </AppControllerProvider>
      </AppStateProviders>
    </WebSocketProviders>
  </React.StrictMode>
);

