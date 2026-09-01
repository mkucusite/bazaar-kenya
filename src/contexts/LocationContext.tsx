import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { KENYA_COUNTIES } from "@/data/mockData";

type Source = "geo" | "manual" | null;

interface LocationState {
  /** County the visitor is browsing from (or picked manually). */
  county: string | null;
  town: string | null;
  source: Source;
  /** true while the browser prompt / reverse-geocode is in flight */
  detecting: boolean;
  /** the visitor blocked the browser prompt */
  denied: boolean;
  setCounty: (county: string | null) => void;
  detect: () => void;
}

const STORAGE_KEY = "ka_location_v1";

const LocationCtx = createContext<LocationState>({
  county: null,
  town: null,
  source: null,
  detecting: false,
  denied: false,
  setCounty: () => {},
  detect: () => {},
});

export const useLocationPref = () => useContext(LocationCtx);

const normaliseCounty = (raw?: string | null): string | null => {
  if (!raw) return null;
  const clean = raw.replace(/county/i, "").trim().toLowerCase();
  return (
    KENYA_COUNTIES.find((c) => c.toLowerCase() === clean) ||
    KENYA_COUNTIES.find((c) => clean.includes(c.toLowerCase())) ||
    KENYA_COUNTIES.find((c) => c.toLowerCase().includes(clean)) ||
    null
  );
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [county, setCountyState] = useState<string | null>(null);
  const [town, setTown] = useState<string | null>(null);
  const [source, setSource] = useState<Source>(null);
  const [detecting, setDetecting] = useState(false);
  const [denied, setDenied] = useState(false);

  const persist = useCallback((next: { county: string | null; town: string | null; source: Source }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }, []);

  const detect = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          const json = await res.json();
          const detected = normaliseCounty(json?.principalSubdivision) || normaliseCounty(json?.locality);
          const locality: string | null = json?.locality || json?.city || null;
          if (detected) {
            setCountyState(detected);
            setTown(locality);
            setSource("geo");
            persist({ county: detected, town: locality, source: "geo" });
          }
        } catch {
          /* offline — stay national */
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDenied(true);
        setDetecting(false);
        persist({ county: null, town: null, source: null });
      },
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  }, [persist]);

  // First visit: ask for location straight away so everything is localised.
  useEffect(() => {
    let stored: { county?: string; town?: string; source?: Source } | null = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      stored = null;
    }
    if (stored?.county) {
      setCountyState(stored.county);
      setTown(stored.town || null);
      setSource(stored.source || "manual");
      return;
    }
    if (stored) return; // already asked and declined — never nag again
    const id = window.setTimeout(detect, 1200);
    return () => window.clearTimeout(id);
  }, [detect]);

  const setCounty = useCallback(
    (next: string | null) => {
      setCountyState(next);
      setTown(null);
      setSource(next ? "manual" : null);
      persist({ county: next, town: null, source: next ? "manual" : null });
    },
    [persist],
  );

  const value = useMemo(
    () => ({ county, town, source, detecting, denied, setCounty, detect }),
    [county, town, source, detecting, denied, setCounty, detect],
  );

  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
};
