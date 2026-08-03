import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './components/index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Handle dynamic chunk import loading failures (e.g. after new deployments)
const RELOAD_KEY = "vite_chunk_reload_attempts";

function isDynamicImportError(err: any): boolean {
  if (!err) return false;
  const message = err.message || (typeof err === "string" ? err : "") || "";
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Unable to preload CSS")
  );
}

function handleAutoReload(err: any) {
  if (isDynamicImportError(err)) {
    const hasReloaded = sessionStorage.getItem(RELOAD_KEY);
    if (!hasReloaded) {
      sessionStorage.setItem(RELOAD_KEY, "true");
      window.location.reload();
    }
  }
}

// 1. Detect Vite preload errors
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  handleAutoReload("Failed to fetch dynamically imported module");
});

// 2. Global error listener for dynamic import errors
window.addEventListener("error", (event) => {
  if (isDynamicImportError(event.error) || isDynamicImportError(event.message)) {
    handleAutoReload(event.error || event.message);
  }
});

// 3. Unhandled rejection listener for failed module imports
window.addEventListener("unhandledrejection", (event) => {
  if (isDynamicImportError(event.reason)) {
    handleAutoReload(event.reason);
  }
});

// Clear reload flag after successful initial load
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      sessionStorage.removeItem(RELOAD_KEY);
      sessionStorage.removeItem("vite_preload_reloaded");
    }, 4000);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

