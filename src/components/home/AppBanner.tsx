import { Smartphone } from "lucide-react";

const AppBanner = () => {
  return (
    <section className="px-4 md:px-8 lg:px-16 xl:px-24 py-10">
      <div className="bg-primary/5 border border-primary/10 rounded-2xl px-6 md:px-12 py-10 md:py-14">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-2">
              Take KenyaAdvert with you everywhere
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Download our app and never miss a deal. Browse, buy and sell on the go.
            </p>
            <a href="#" className="inline-block">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
                className="h-11"
              />
            </a>
          </div>
          <div className="flex-shrink-0">
            <div className="w-40 h-72 bg-foreground rounded-[1.75rem] border-4 border-foreground/80 flex items-center justify-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground rounded-b-xl" />
              <div className="text-center p-4">
                <div className="w-10 h-10 bg-primary rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">KA</span>
                </div>
                <p className="text-background text-xs font-medium">KenyaAdvert</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">Buy. Sell. Advertise.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
