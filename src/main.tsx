import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fontsource-variable/sora";
import "@fontsource-variable/vazirmatn";
import "./index.css";
import App from "./App";
import { initPerfProbe } from "./lib/perfProbe";

initPerfProbe();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
