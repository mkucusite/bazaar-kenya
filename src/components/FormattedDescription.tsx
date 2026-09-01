import { Fragment, useMemo } from "react";

interface FormattedDescriptionProps {
  text: string;
  className?: string;
}

/**
 * Renders a description with basic formatting:
 * - Lines starting with "- ", "* ", "• " become bullet items
 * - Lines starting with "1.", "2." etc. become numbered list items
 * - Lines starting with "## " become subheadings
 * - "**bold**" becomes <strong>
 * - Blank lines separate paragraphs
 *
 * No HTML is rendered from the source string — everything is built as React nodes.
 */
// Tokenize a string into bold (**...**) + URLs + plain text segments.
const URL_RE = /(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+)/i;
const BOLD_RE = /\*\*(.+?)\*\*/;

const renderInline = (text: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length) {
    const bold = remaining.match(BOLD_RE);
    const link = remaining.match(URL_RE);
    const boldIdx = bold ? bold.index! : Infinity;
    const linkIdx = link ? link.index! : Infinity;
    if (boldIdx === Infinity && linkIdx === Infinity) {
      out.push(<Fragment key={`t-${key++}`}>{remaining}</Fragment>);
      break;
    }
    if (boldIdx <= linkIdx) {
      if (boldIdx > 0) out.push(<Fragment key={`t-${key++}`}>{remaining.slice(0, boldIdx)}</Fragment>);
      out.push(<strong key={`b-${key++}`} className="font-semibold text-foreground">{bold![1]}</strong>);
      remaining = remaining.slice(boldIdx + bold![0].length);
    } else {
      if (linkIdx > 0) out.push(<Fragment key={`t-${key++}`}>{remaining.slice(0, linkIdx)}</Fragment>);
      const raw = link![0];
      const href = raw.startsWith("http") ? raw : `https://${raw}`;
      out.push(
        <a
          key={`l-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 break-all"
        >
          {raw}
        </a>
      );
      remaining = remaining.slice(linkIdx + raw.length);
    }
  }
  return out;
};

// Lines like "Capacity: 512GB" — short label, short value, no markdown markers.
const SPEC_LINE = /^([A-Z][A-Za-z0-9 /&()+.\-]{1,40}):\s+(.{1,200})$/;

const normalizeDescriptionText = (value: string) => {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/(\d)([A-Z][a-z])/g, "$1\n$2")
    .replace(/([.!?])([A-Z][a-z])/g, "$1\n\n$2");
};

const FormattedDescription = ({ text, className }: FormattedDescriptionProps) => {
  const blocks = useMemo(() => {
    if (!text) return [] as React.ReactNode[];
    const lines = normalizeDescriptionText(text).split("\n");
    const out: React.ReactNode[] = [];
    let bullets: string[] = [];
    let numbered: string[] = [];
    let para: string[] = [];
    let specs: { label: string; value: string }[] = [];

    const flushBullets = () => {
      if (bullets.length) {
        out.push(
          <ul key={`ul-${out.length}`} className="list-disc pl-5 space-y-1.5 my-3 text-foreground/90 break-words">
            {bullets.map((b, i) => (
              <li key={i} className="leading-relaxed">{renderInline(b)}</li>
            ))}
          </ul>,
        );
        bullets = [];
      }
    };
    const flushNumbered = () => {
      if (numbered.length) {
        out.push(
          <ol key={`ol-${out.length}`} className="list-decimal pl-5 space-y-1.5 my-3 text-foreground/90 break-words">
            {numbered.map((b, i) => (
              <li key={i} className="leading-relaxed">{renderInline(b)}</li>
            ))}
          </ol>,
        );
        numbered = [];
      }
    };
    const flushPara = () => {
      if (para.length) {
        out.push(
          <p key={`p-${out.length}`} className="text-foreground/90 leading-relaxed my-2.5 break-words">
            {para.map((line, i) => (
              <Fragment key={i}>
                {renderInline(line)}
                {i < para.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>,
        );
        para = [];
      }
    };
    const flushSpecs = () => {
      if (specs.length) {
        out.push(
          <div key={`spec-${out.length}`} className="my-3 rounded-lg border border-border/60 overflow-hidden bg-card/50">
            <dl className="divide-y divide-border/60">
              {specs.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 px-3 py-2">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="text-sm font-medium text-foreground break-words">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>,
        );
        specs = [];
      }
    };
    const flushAll = () => {
      flushBullets();
      flushNumbered();
      flushSpecs();
      flushPara();
    };

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) {
        flushAll();
        continue;
      }
      if (/^#{1,6}\s+/.test(line)) {
        flushAll();
        out.push(
          <h3 key={`h-${out.length}`} className="font-heading font-semibold text-base text-foreground mt-4 mb-1.5">
            {renderInline(line.replace(/^#{1,6}\s+/, ""))}
          </h3>,
        );
        continue;
      }
      const stripped = line.replace(/[*_]/g, "").trim();
      // ALL CAPS short line OR short "Heading:" line → subheading
      const isShortHeading = stripped.length > 0 && stripped.length <= 60 && (
        (/^[A-Z0-9 .,'&\-]+$/.test(stripped) && /[A-Z]{3,}/.test(stripped)) ||
        /^[A-Z][A-Za-z0-9 ,'&\-]{2,58}:$/.test(stripped)
      );
      if (isShortHeading) {
        flushAll();
        out.push(
          <h3 key={`h-${out.length}`} className="font-heading font-semibold text-base text-foreground mt-4 mb-1.5">
            {stripped.replace(/:$/, "")}
          </h3>,
        );
        continue;
      }
      // Decorative separator lines (***, ---) → ignore
      if (/^[*_\-=]{3,}$/.test(stripped)) {
        flushAll();
        continue;
      }
      if (/^\s*[-*•]\s+/.test(line)) {
        flushNumbered();
        flushSpecs();
        flushPara();
        bullets.push(line.replace(/^\s*[-*•]\s+/, ""));
        continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        flushBullets();
        flushSpecs();
        flushPara();
        numbered.push(line.replace(/^\s*\d+[.)]\s+/, ""));
        continue;
      }
      const specMatch = line.match(SPEC_LINE);
      if (specMatch) {
        flushBullets();
        flushNumbered();
        flushPara();
        specs.push({ label: specMatch[1].trim(), value: specMatch[2].trim() });
        continue;
      }
      flushBullets();
      flushNumbered();
      flushSpecs();
      para.push(line);
    }
    flushAll();
    return out;
  }, [text]);

  if (blocks.length === 0) {
    return <p className={className}>No description provided.</p>;
  }

  return <div className={className}>{blocks}</div>;
};

export default FormattedDescription;
