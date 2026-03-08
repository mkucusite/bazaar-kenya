import { Shield, Smartphone, Users, Zap } from "lucide-react";

const badges = [
  { icon: Zap, label: "Free to Post" },
  { icon: Shield, label: "Safe & Secure" },
  { icon: Users, label: "1000s of Buyers" },
  { icon: Smartphone, label: "Mobile Friendly" },
];

const TrustBadges = () => {
  return (
    <section className="bg-card border-b border-border/50">
      <div className="section-padding !py-3.5">
        <div className="flex items-center justify-between md:justify-center md:gap-12 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-2 flex-shrink-0 px-1">
              <b.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground whitespace-nowrap">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
