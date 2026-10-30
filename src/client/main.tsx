import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { SettingsProvider } from "./hooks/useSettings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
