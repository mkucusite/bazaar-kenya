import { Camera, CreditCard, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Post Your Ad",
    description: "Take photos and describe what you're selling. It's free!",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: CreditCard,
    title: "Choose a Package",
    description: "Boost visibility with Gold or Silver badges for more exposure.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: CheckCircle,
    title: "Start Selling",
    description: "Connect with buyers via call, WhatsApp, or chat. Done!",
    color: "bg-emerald-100 text-emerald-600",
  },
];

const HowItWorks = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="text-center mb-8">
          <h2 className="font-heading text-lg md:text-xl text-foreground mb-2">How It Works</h2>
          <p className="text-sm text-muted-foreground">Sell anything in 3 easy steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              
              <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 relative z-10`}>
                <step.icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-sm md:text-base text-foreground mb-1">{step.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
