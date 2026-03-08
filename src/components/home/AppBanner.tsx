import { Smartphone, Download, ShieldCheck } from "lucide-react";

const AppBanner = () => {
  return (
    <section className="section-padding bg-muted/30">
      <div className="page-container rounded-2xl border border-border bg-card p-4 md:p-6">
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[auto_1fr_auto]">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Smartphone className="h-6 w-6" />
          </div>

          <div>
            <h3 className="font-heading text-base font-bold text-foreground md:text-lg">Take KenyaAdvert everywhere</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse new listings, chat faster, and manage your ads from your phone.
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure login and verified deals
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              <Download className="h-3.5 w-3.5" /> Google Play
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> App Store
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
