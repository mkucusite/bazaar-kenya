import { MapPin, Crosshair, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { KENYA_COUNTIES } from "@/data/mockData";
import { useLocationPref } from "@/contexts/LocationContext";

/** Slim strip that tells the visitor what area the page is tuned to. */
const LocationBar = () => {
  const { county, town, detecting, denied, setCounty, detect } = useLocationPref();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/60 bg-secondary/40">
      <div className="container-app flex items-center gap-2 py-2 text-xs sm:text-sm">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {detecting ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding what's near you…
            </span>
          ) : county ? (
            <>
              Showing results near{" "}
              <span className="font-semibold text-foreground">{town ? `${town}, ${county}` : county}</span>
            </>
          ) : (
            <>Browsing all 47 counties</>
          )}
        </span>

        {!county && !detecting && (
          <button
            type="button"
            onClick={detect}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground sm:text-xs"
          >
            <Crosshair className="h-3.5 w-3.5" /> {denied ? "Retry" : "Use my location"}
          </button>
        )}

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground sm:text-xs"
          >
            {county ? "Change" : "Pick county"} <ChevronDown className="h-3 w-3" />
          </button>
          {open && (
            <div className="absolute right-0 z-40 mt-1 max-h-72 w-52 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setCounty(null);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
              >
                All of Kenya
              </button>
              {KENYA_COUNTIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCounty(c);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs hover:bg-muted ${
                    c === county ? "font-bold text-primary" : "text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationBar;
