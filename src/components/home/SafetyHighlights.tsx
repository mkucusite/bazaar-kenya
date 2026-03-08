import { ShieldCheck, UserCheck, TriangleAlert } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Verified listings",
    description: "Every listing goes through quality and safety checks before it appears.",
  },
  {
    icon: UserCheck,
    title: "Trusted sellers",
    description: "Business profiles and seller history help buyers choose with confidence.",
  },
  {
    icon: TriangleAlert,
    title: "Scam prevention",
    description: "Built-in safety prompts guide users before meetings and payments.",
  },
];

const SafetyHighlights = () => {
  return (
    <section className="section-padding !pt-2 md:!pt-4">
      <div className="page-container grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SafetyHighlights;
