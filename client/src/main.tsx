import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// WebSocket already disabled in HTML head

createRoot(document.getElementById("root")!).render(<App />);
