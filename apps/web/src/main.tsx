import { Agentation } from "agentation";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { QueryProvider } from "./providers/QueryProvider";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
      {import.meta.env.DEV ? <Agentation /> : null}
    </QueryProvider>
  </StrictMode>,
);
