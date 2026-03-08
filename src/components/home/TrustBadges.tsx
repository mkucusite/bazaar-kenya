import { Shield, Smartphone, Users, Zap } from "lucide-react";

const badges = [
  { icon: Zap, label: "Free Posting" },
  { icon: Shield, label: "Safer Deals" },
  { icon: Users, label: "Active Buyers" },
  { icon: Smartphone, label: "Built for Mobile" },
];

const TrustBadges = () => {
  return (
    <section className="bg-background">
      <div className="section-padding !py-4">
        <div className="page-container grid grid-cols-2 gap-2 sm:grid-cols-4">
          {badges.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
