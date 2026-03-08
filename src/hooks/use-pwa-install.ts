import { useState, useEffect } from "react";

let deferredPrompt: any = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn());
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

export function usePwaInstall() {
  const [ready, setReady] = useState(!!deferredPrompt);

  useEffect(() => {
    const update = () => setReady(!!deferredPrompt);
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setReady(false);
  };

  return { ready, install };
}
