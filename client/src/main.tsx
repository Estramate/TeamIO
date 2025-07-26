import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable WebSocket completely in development to prevent Replit's internal errors
if (import.meta.env.DEV) {
  console.log('WebSocket disabled in development environment');
  
  // Override WebSocket constructor to prevent all WebSocket connections
  const MockWebSocket = function(this: any, url?: string) {
    this.readyState = 3; // CLOSED
    this.url = url || '';
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    // Simulate immediate close
    setTimeout(() => {
      if (this.onclose) this.onclose();
    }, 0);
  };
  
  MockWebSocket.prototype.close = function() {};
  MockWebSocket.prototype.send = function() {};
  MockWebSocket.prototype.addEventListener = function() {};
  MockWebSocket.prototype.removeEventListener = function() {};
  
  (window as any).WebSocket = MockWebSocket;
}

createRoot(document.getElementById("root")!).render(<App />);
