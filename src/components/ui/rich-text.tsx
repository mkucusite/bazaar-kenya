import React from "react";
import { cn } from "@/lib/utils";

// Auto-linkifies URLs, emails, phones and preserves line breaks.
// Wraps long tokens so URLs don't break responsive layouts.
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[\w.-]+@[\w.-]+\.[A-Za-z]{2,}|\+?\d[\d\s\-()]{7,}\d)/g;

function renderTokens(text: string, keyPrefix: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0;
      let href = part;
      let label = part;
      if (part.includes("@") && !part.startsWith("http")) {
        href = `mailto:${part}`;
      } else if (/^\+?\d[\d\s\-()]{7,}\d$/.test(part)) {
        href = `tel:${part.replace(/\s+/g, "")}`;
      } else if (part.startsWith("www.")) {
        href = `https://${part}`;
      }
      // Truncate visual label of very long URLs
      if (label.length > 48 && href.startsWith("http")) {
        try {
          const u = new URL(href);
          label = u.hostname + (u.pathname !== "/" ? u.pathname.slice(0, 18) + "…" : "");
        } catch { /* keep */ }
      }
      return (
        <a
          key={`${keyPrefix}-${i}`}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="break-all text-primary underline-offset-2 hover:underline"
        >
          {label}
        </a>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

interface RichTextProps {
  text?: string | null;
  className?: string;
  as?: "p" | "div";
}

export function RichText({ text, className, as: Tag = "p" }: RichTextProps) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  return (
    <Tag className={cn("whitespace-pre-line break-words [overflow-wrap:anywhere]", className)}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {renderTokens(line, `l${idx}`)}
          {idx < lines.length - 1 && "\n"}
        </React.Fragment>
      ))}
    </Tag>
  );
}

export default RichText;
