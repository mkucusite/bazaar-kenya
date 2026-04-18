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
const renderInline = (text: string) => {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<Fragment key={`t-${key++}`}>{text.slice(last, match.index)}</Fragment>);
    parts.push(<strong key={`b-${key++}`} className="font-semibold text-foreground">{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<Fragment key={`t-${key++}`}>{text.slice(last)}</Fragment>);
  return parts;
};

const FormattedDescription = ({ text, className }: FormattedDescriptionProps) => {
  const blocks = useMemo(() => {
    if (!text) return [] as React.ReactNode[];
    const lines = text.split("\n");
    const out: React.ReactNode[] = [];
    let bullets: string[] = [];
    let numbered: string[] = [];
    let para: string[] = [];

    const flushBullets = () => {
      if (bullets.length) {
        out.push(
          <ul key={`ul-${out.length}`} className="list-disc pl-5 space-y-1.5 my-3 text-foreground/90">
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
          <ol key={`ol-${out.length}`} className="list-decimal pl-5 space-y-1.5 my-3 text-foreground/90">
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
          <p key={`p-${out.length}`} className="text-foreground/90 leading-relaxed my-2.5">
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

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) {
        flushBullets();
        flushNumbered();
        flushPara();
        continue;
      }
      if (/^##\s+/.test(line)) {
        flushBullets();
        flushNumbered();
        flushPara();
        out.push(
          <h3 key={`h-${out.length}`} className="font-heading font-semibold text-base text-foreground mt-4 mb-1.5">
            {renderInline(line.replace(/^##\s+/, ""))}
          </h3>,
        );
        continue;
      }
      if (/^\s*[-*•]\s+/.test(line)) {
        flushNumbered();
        flushPara();
        bullets.push(line.replace(/^\s*[-*•]\s+/, ""));
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        flushBullets();
        flushPara();
        numbered.push(line.replace(/^\s*\d+\.\s+/, ""));
        continue;
      }
      flushBullets();
      flushNumbered();
      para.push(line);
    }
    flushBullets();
    flushNumbered();
    flushPara();
    return out;
  }, [text]);

  if (blocks.length === 0) {
    return <p className={className}>No description provided.</p>;
  }

  return <div className={className}>{blocks}</div>;
};

export default FormattedDescription;
