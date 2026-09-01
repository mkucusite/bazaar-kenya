import { useCallback, useEffect, useState } from "react";

const KEY = "ka_favourites_v1";

const readSet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const writeSet = (set: Set<string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent("ka:favourites:changed"));
  } catch {}
};

export const useFavourite = (id?: string) => {
  const [saved, setSaved] = useState<boolean>(() => (id ? readSet().has(id) : false));

  useEffect(() => {
    const sync = () => setSaved(id ? readSet().has(id) : false);
    window.addEventListener("ka:favourites:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ka:favourites:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  const toggle = useCallback(() => {
    if (!id) return false;
    const set = readSet();
    if (set.has(id)) {
      set.delete(id);
      writeSet(set);
      setSaved(false);
      return false;
    }
    set.add(id);
    writeSet(set);
    setSaved(true);
    return true;
  }, [id]);

  return { saved, toggle };
};

export const getFavouriteIds = (): string[] => Array.from(readSet());
