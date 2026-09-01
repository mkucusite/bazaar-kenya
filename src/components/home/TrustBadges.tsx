import { Shield, ShieldCheck, Smartphone, Users, Zap, Lock } from "lucide-react";

const badges = [
  { icon: Zap, label: "Free to Post", color: "text-primary" },
  { icon: ShieldCheck, label: "Safe & Secure", color: "text-emerald-600" },
  { icon: Lock, label: "M-Pesa Secure", color: "text-primary" },
  { icon: Users, label: "50K+ Buyers", color: "text-blue-600" },
  { icon: Smartphone, label: "Mobile Friendly", color: "text-violet-600" },
];

const TrustBadges = () => {
  return (
    <section className="bg-card border-b border-border/40">
      <div className="container-app py-4 xl:py-5">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide md:justify-center md:gap-12 xl:gap-16">
          {badges.map((b) => (
            <div key={b.label} className="flex flex-shrink-0 items-center gap-2 px-2.5">
              <b.icon className={`h-5 w-5 ${b.color} flex-shrink-0`} />
              <span className="whitespace-nowrap text-sm font-medium text-foreground xl:text-base">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
