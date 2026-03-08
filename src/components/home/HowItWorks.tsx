import { Camera, FileText, Handshake } from "lucide-react";

const steps = [
  { icon: Camera, title: "Snap a Photo", desc: "Take a photo of what you want to sell" },
  { icon: FileText, title: "Create Your Ad", desc: "Add details — AI helps write your description" },
  { icon: Handshake, title: "Close the Deal", desc: "Connect with buyers via call, WhatsApp or chat" },
];

const HowItWorks = () => {
  return (
    <section className="section-padding">
      <h2 className="font-heading font-bold text-lg md:text-xl text-foreground text-center mb-6">
        How It Works
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-lg md:max-w-2xl mx-auto">
        {steps.map((step, i) => (
          <div key={step.title} className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2.5 relative">
              <step.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <h3 className="font-heading font-semibold text-xs md:text-sm text-foreground mb-0.5">{step.title}</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground leading-snug">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
