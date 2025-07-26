import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable WebSocket completely in development to prevent Replit's internal errors
if (import.meta.env.DEV) {
  console.log('WebSocket disabled in development environment');
  (window as any).WebSocket = class {
    constructor() {
      // Mock WebSocket that does nothing
      this.readyState = 3; // CLOSED
    }
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

createRoot(document.getElementById("root")!).render(<App />);
