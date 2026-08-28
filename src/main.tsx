import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fontsource-variable/sora";
import "@fontsource-variable/vazirmatn";
import "./index.css";
import App from "./App";
import { initPerfProbe } from "./lib/perfProbe";
import { markCoreReady } from "./lib/assetProgress";

initPerfProbe();
// the app shell is up — the detailed loader's "core" step is done
markCoreReady();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
