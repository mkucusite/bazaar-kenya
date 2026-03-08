import { Smartphone, Download } from "lucide-react";

const AppBanner = () => {
  return (
    <section className="section-padding bg-muted/30">
      <div className="bg-primary/5 border border-primary/10 rounded-2xl px-5 py-6 md:px-8 md:py-8">
        <div className="flex items-center gap-5 max-w-lg mx-auto">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-sm md:text-base text-foreground mb-0.5">
              Take KenyaAdvert with you
            </h3>
            <p className="text-[11px] md:text-xs text-muted-foreground mb-2.5">
              Download our app. Browse, buy and sell on the go.
            </p>
            <a href="#" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-foreground text-background rounded-lg text-xs font-medium hover:bg-foreground/90 transition-colors">
              <Download className="w-3.5 h-3.5" /> Get on Google Play
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
