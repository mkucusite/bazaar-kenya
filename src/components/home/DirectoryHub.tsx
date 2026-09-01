import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ALL_DIRECTORY_KINDS, DIRECTORY_KINDS } from "@/lib/directory";
import { DIRECTORY_ACCENT, DIRECTORY_ICONS } from "@/components/home/DirectoryRails";

/** Compact entry grid to every vertical the site runs — keeps the homepage balanced. */
const DirectoryHub = () => (
  <section className="section-padding">
    <div className="container-app">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">More than classifieds</p>
        <h2 className="font-heading text-2xl text-foreground md:text-3xl">Explore every directory</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Doctors, developers, hotels, vehicles, safaris, restaurants, salons, schools, gyms, fundis and jobs — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ALL_DIRECTORY_KINDS.map((kind) => {
          const config = DIRECTORY_KINDS[kind];
          const Icon = DIRECTORY_ICONS[kind] || Sparkles;
          return (
            <Link
              key={kind}
              to={config.path}
              className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${DIRECTORY_ACCENT[kind] || "bg-primary/10 text-primary"}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-foreground">{config.label}</span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">{config.tagline}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

export default DirectoryHub;
