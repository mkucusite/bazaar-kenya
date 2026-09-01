import { useMemo, useState } from "react";
import { CalendarDays, Mail, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  listingName: string;
  email: string | null;
  whatsapp: string | null;
}

const BookingEnquiryDialog = ({ listingName, email, whatsapp }: Props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [note, setNote] = useState("");

  const message = useMemo(
    () =>
      [
        `Hello, I would like to book ${listingName}.`,
        `Preferred date: ${date || "To be confirmed"}`,
        `Guests: ${guests}`,
        `Name: ${name || "Not provided"}`,
        `Phone: ${phone || "Not provided"}`,
        note ? `Note: ${note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [date, guests, listingName, name, note, phone],
  );

  const emailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(`Booking enquiry: ${listingName}`)}&body=${encodeURIComponent(message)}`
    : null;
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-12 w-full font-semibold">
          <CalendarDays className="h-4 w-4" /> Book this trip
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {listingName}</DialogTitle>
          <DialogDescription>Choose your date and send the complete enquiry directly to the operator.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Preferred date *</label>
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Your name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Guests</label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <input type="number" min="1" max="100" value={guests} onChange={(e) => setGuests(e.target.value)} className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Phone *</label>
            <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Message</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pickup point, children, room preference or dietary needs" className="mt-1 min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm" />
          </div>
          {!emailHref && !whatsappHref && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">This operator has not added an email or WhatsApp contact yet.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {emailHref && (
              <Button asChild disabled={!date || !name.trim() || !phone.trim()}>
                <a href={date && name.trim() && phone.trim() ? emailHref : undefined}>
                  <Mail className="h-4 w-4" /> Send by email
                </a>
              </Button>
            )}
            {whatsappHref && (
              <Button asChild variant="outline" disabled={!date || !name.trim() || !phone.trim()}>
                <a href={date && name.trim() && phone.trim() ? whatsappHref : undefined} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp operator
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingEnquiryDialog;