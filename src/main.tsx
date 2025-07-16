import React from "react";
import ReactDOM from "react-dom/client";
import { HeroUIProvider } from "@heroui/system";
import App from "@/App";

import "@/index.css";
import { ToastProvider } from "@/providers/ToastProvider";
import { ElectronApiProvider } from "@/providers/ElectronApiProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HeroUIProvider>
      <ToastProvider>
        <ElectronApiProvider>
          <App />
        </ElectronApiProvider>
      </ToastProvider>
    </HeroUIProvider>
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
