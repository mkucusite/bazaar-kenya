import { Shield, Smartphone, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  { icon: Zap, label: "Free to Post", desc: "No hidden charges" },
  { icon: Shield, label: "Safe & Secure", desc: "Verified sellers" },
  { icon: Users, label: "Thousands of Buyers", desc: "Across 47 counties" },
  { icon: Smartphone, label: "Mobile Friendly", desc: "Works everywhere" },
];

const TrustBadges = () => {
  return (
    <section className="bg-card border-b border-border">
      <div className="section-padding py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 justify-center md:justify-start"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.label}</p>
                <p className="text-[11px] text-muted-foreground hidden md:block">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
