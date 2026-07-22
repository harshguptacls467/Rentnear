import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { ChartProvider } from "./context/chartContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChartProvider>
      <App />
    </ChartProvider>
  </StrictMode>,
);
