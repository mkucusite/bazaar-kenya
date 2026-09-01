import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { SERVICE_GROUPS, SERVICE_TOPICS } from "@/lib/services";
import { ALL_DIRECTORY_KINDS, DIRECTORY_KINDS } from "@/lib/directory";

const ServicesIndexPage = () => (
  <div className="min-h-screen overflow-x-hidden bg-background">
    <SEOHead
      title="Services in Kenya — Massage, Car Hire, Fundis & More"
      description="Browse services in Kenya: room massage, spa days, car hire, safaris, plumbers, salons, photographers, gyms and doctors. Prices, providers and direct contacts."
      canonical="https://www.kenyaadverts.com/services"
      keywords="services in Kenya, room massage Nairobi, car hire Kenya, plumber near me Kenya, salon Nairobi, safari packages Kenya, photographers Kenya, gyms Nairobi"
    />
    <Navbar />
    <main className="pb-20 md:pb-10">
      <section className="border-b border-border/60 bg-secondary/30 py-8">
        <div className="container-app">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Everything people ask for</p>
          <h1 className="font-heading text-2xl text-foreground md:text-4xl">Services in Kenya</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Every service page below pulls together real providers, live adverts, honest price guides and answers —
            filtered to your county in one tap.
          </p>
        </div>
      </section>

      {SERVICE_GROUPS.map((group) => (
        <section key={group} className="container-app py-6">
          <h2 className="mb-3 font-heading text-lg text-foreground md:text-xl">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_TOPICS.filter((s) => s.group === group).map((s) => (
              <Link
                key={s.slug}
                to={`/services/${s.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img
                    src={s.image}
                    alt={s.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.intro}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    View providers <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="container-app py-8">
        <h2 className="mb-3 font-heading text-lg text-foreground md:text-xl">Browse the directories</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {ALL_DIRECTORY_KINDS.map((kind) => (
            <Link
              key={kind}
              to={DIRECTORY_KINDS[kind].path}
              className="rounded-xl border border-border bg-card p-3 text-center text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {DIRECTORY_KINDS[kind].label}
            </Link>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default ServicesIndexPage;
