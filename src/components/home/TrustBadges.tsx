import { Shield, Smartphone, Users, Zap } from "lucide-react";

const badges = [
  { icon: Zap, label: "Free to Post" },
  { icon: Shield, label: "Safe & Secure" },
  { icon: Users, label: "Thousands of Buyers" },
  { icon: Smartphone, label: "Mobile Friendly" },
];

const TrustBadges = () => {
  return (
    <section className="bg-surface-grey">
      <div className="section-padding py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center justify-center gap-2 text-center">
              <b.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
