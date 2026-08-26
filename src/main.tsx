
  const originalError = console.error;
  console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.WebGLProgram')) {
          fetch('/log', { method: 'POST', body: args[0] }).catch(()=>{});
      }
      originalError.apply(console, args);
  };
  import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fontsource-variable/sora";
import "@fontsource-variable/vazirmatn";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
