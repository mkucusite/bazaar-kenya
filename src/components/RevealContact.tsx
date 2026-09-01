import { useState } from "react";
import { Eye, Mail, MessageCircle, Phone } from "lucide-react";

const digits = (v: string) => v.replace(/[^0-9]/g, "");
const waNumber = (v: string) => digits(v).replace(/^0/, "254");
const mask = (v: string) => {
  const d = digits(v);
  if (d.length < 6) return "•••• ••••";
  return `${d.slice(0, 4)} •••• ${d.slice(-2)}`;
};

interface Props {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  /** message prefilled into WhatsApp */
  message?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Contact details stay hidden until the visitor taps once.
 * Keeps numbers away from scrapers and tells us there is real intent.
 */
const RevealContact = ({ phone, whatsapp, email, message, className = "", compact = false }: Props) => {
  const [revealed, setRevealed] = useState(false);
  const wa = whatsapp || phone;

  if (!phone && !whatsapp && !email) {
    return <p className="text-sm text-muted-foreground">No contact details were provided.</p>;
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 ${className}`}
      >
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> Show contact
        </span>
        <span className="text-xs font-medium opacity-80">{phone || whatsapp ? mask(phone || whatsapp || "") : "email"}</span>
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-between gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> Call now
          </span>
          <span className="text-xs font-medium opacity-80">{phone}</span>
        </a>
      )}
      {wa && (
        <a
          href={`https://wa.me/${waNumber(wa)}${message ? `?text=${encodeURIComponent(message)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
        >
          <span className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </span>
          {!compact && <span className="text-xs font-medium opacity-80">{wa}</span>}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground"
        >
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
          </span>
          {!compact && <span className="max-w-[45%] truncate text-xs font-medium text-muted-foreground">{email}</span>}
        </a>
      )}
    </div>
  );
};

export default RevealContact;
