import { Smartphone } from "lucide-react";

const AppBanner = () => {
  return (
    <section className="section-padding py-12 md:py-16">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3">
            Take KenyaAdvert with you everywhere
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Download our app and never miss a deal. Browse, buy and sell on the go.
          </p>
          <a href="#" className="inline-block">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Get it on Google Play"
              className="h-12"
            />
          </a>
        </div>
        <div className="flex-shrink-0">
          <div className="w-48 h-80 bg-foreground rounded-3xl border-4 border-muted flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-6 bg-foreground rounded-b-lg flex items-center justify-center">
              <div className="w-16 h-3 bg-muted-foreground/30 rounded-full" />
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary rounded-xl mx-auto mb-2 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">KA</span>
              </div>
              <p className="text-background text-xs font-medium">KenyaAdvert</p>
              <p className="text-muted-foreground text-[10px] mt-1">Buy. Sell. Advertise.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
