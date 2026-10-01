import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root is missing from index.html.");

createRoot(rootElement).render(
  // StrictMode deliberately mounts, unmounts and remounts every component once in DEVELOPMENT
  // only. It is not a bug: it surfaces effects that do not clean up after themselves. Every
  // fetch in this app is aborted on cleanup, which is what keeps that double-run harmless.
  <StrictMode>
    <App />
  </StrictMode>
);
