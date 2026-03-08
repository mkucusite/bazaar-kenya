import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove SEO fallback once React hydrates
const seoFallback = document.getElementById("seo-fallback");
if (seoFallback) seoFallback.remove();

createRoot(document.getElementById("root")!).render(<App />);
