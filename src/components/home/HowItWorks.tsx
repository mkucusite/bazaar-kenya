import { Shield, Sparkles, UploadCloud } from "lucide-react";

const steps = [
  {
    icon: UploadCloud,
    title: "Post in 2 minutes",
    desc: "Snap photos, add details, and publish from your phone.",
  },
  {
    icon: Sparkles,
    title: "Get instant visibility",
    desc: "Your listing appears in search and category feeds quickly.",
  },
  {
    icon: Shield,
    title: "Sell confidently",
    desc: "In-app safety guidance helps protect every transaction.",
  },
];

const HowItWorks = () => {
  return (
    <section className="section-padding !pt-4">
      <div className="page-container">
        <h2 className="mb-4 text-center font-heading text-lg font-bold text-foreground md:text-xl">How it works</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
