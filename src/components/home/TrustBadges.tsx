import { Shield, Smartphone, Users, Zap } from "lucide-react";

const badges = [
  { icon: Zap, label: "Free to Post", color: "text-primary" },
  { icon: Shield, label: "Safe & Secure", color: "text-emerald-600" },
  { icon: Users, label: "50K+ Buyers", color: "text-blue-600" },
  { icon: Smartphone, label: "Mobile Friendly", color: "text-violet-600" },
];

const TrustBadges = () => {
  return (
    <section className="bg-card border-b border-border/40">
      <div className="container-app py-3">
        <div className="flex items-center justify-between md:justify-center md:gap-10 overflow-x-auto scrollbar-hide">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 flex-shrink-0 px-2">
              <b.icon className={`w-4 h-4 ${b.color} flex-shrink-0`} />
              <span className="text-xs font-medium text-foreground whitespace-nowrap">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
