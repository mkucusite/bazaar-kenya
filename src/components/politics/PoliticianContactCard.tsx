import { Mail, Globe, MessageCircle, Sparkles } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";

interface Props {
  politicianName: string;
  politicianWebsite?: string | null;
}

const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
};

const PoliticianContactCard = ({ politicianName, politicianWebsite }: Props) => {
  const { data: config } = useSiteConfig();
  const email = config?.politician_contact_email || "hydrocephcare@gmail.com";
  const whatsappRaw = config?.politician_contact_whatsapp || "0115475543";
  const showWhatsapp = config?.politician_show_whatsapp !== "false";
  const showWebsiteOffer = config?.politician_show_website_offer !== "false";
  const whatsapp = normalizePhone(whatsappRaw);

  if (!showWebsiteOffer && !politicianWebsite) return null;

  const firstName = politicianName.split(" ")[0];
  const emailSubject = encodeURIComponent(`Website request for ${politicianName}`);
  const emailBody = encodeURIComponent(
    `Hi,\n\nI'd like to build a personal campaign website for ${politicianName}. Please share pricing and next steps.\n\nThanks.`
  );
  const waMessage = encodeURIComponent(
    `Hello, I'd like a personal campaign website built for ${politicianName}. Please share details.`
  );

  return (
    <div className="border-t border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-xl bg-primary/15 p-2 text-primary">
          <Globe className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold md:text-xl">
            {politicianWebsite
              ? `${firstName}'s official website`
              : `Does ${firstName} need a personal campaign website?`}
          </h2>

          {politicianWebsite ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Visit the official campaign website for {politicianName}:
              <a
                href={politicianWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-semibold text-primary underline underline-offset-2"
              >
                {politicianWebsite.replace(/^https?:\/\//, "")}
              </a>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              We design fast, mobile-first campaign websites for aspirants — own domain, manifesto pages,
              donation form, gallery, live news updates & SEO tuned for {firstName}'s constituency.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {showWebsiteOffer && (
              <a
                href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" /> Get a website — Email us
              </a>
            )}
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"
            >
              <Mail className="h-4 w-4" /> {email}
            </a>
            {showWhatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp {whatsappRaw}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticianContactCard;
