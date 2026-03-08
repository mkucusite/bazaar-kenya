import { Smartphone, Download, Mail } from "lucide-react";
import { useState } from "react";

const AppBanner = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="grid md:grid-cols-2 gap-6">
          {/* App Download */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-base text-foreground mb-1">
                  Take KenyaAdvert With You
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Download our app. Browse, buy and sell on the go.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Get on Google Play
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-base text-foreground mb-1">
                  Stay in the Loop
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get the hottest deals delivered to your inbox weekly.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button className="px-4 h-9 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
