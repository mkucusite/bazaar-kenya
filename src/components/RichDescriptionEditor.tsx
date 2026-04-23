import { useRef } from "react";
import { Bold, List, ListOrdered, Heading2, Table } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Lightweight textarea with formatting helpers (bullets, numbered lists, headings, bold, specs table).
 * Outputs plain text with markdown-like markers that render via FormattedDescription:
 *   - "## Heading"
 *   - "- bullet"
 *   - "1. numbered"
 *   - "**bold**"
 *   - "Label: Value" lines auto-render as a specs table.
 */
const RichDescriptionEditor = ({ value, onChange, placeholder, className }: RichDescriptionEditorProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const focusAt = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      try { ta.setSelectionRange(start, end); } catch {}
    });
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || "text";
    const after = value.slice(end);
    onChange(`${before}${prefix}${selected}${suffix}${after}`);
    focusAt(start + prefix.length, start + prefix.length + selected.length);
  };

  const prefixLines = (marker: (i: number) => string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", Math.max(start - 1, 0)) + 1;
    const lineEnd = value.indexOf("\n", end);
    const realEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, realEnd) || "List item";
    const lines = block.split("\n");
    const prefixed = lines.map((l, i) => {
      const cleaned = l.replace(/^([-*•]|\d+\.|##)\s*/, "");
      return cleaned.trim() ? `${marker(i)}${cleaned}` : `${marker(i)}List item`;
    });
    const next = value.slice(0, lineStart) + prefixed.join("\n") + value.slice(realEnd);
    onChange(next);
    focusAt(lineStart, lineStart + prefixed.join("\n").length);
  };

  const insertSpecsTable = () => {
    const ta = ref.current;
    const pos = ta?.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const after = value.slice(pos);
    const block = `${before && !before.endsWith("\n\n") ? "\n\n" : ""}## Specifications\nBrand: \nModel: \nCondition: \nWarranty: \n${after.startsWith("\n") ? "" : "\n"}`;
    onChange(before + block + after);
    focusAt(before.length + block.indexOf("Brand: ") + 7, before.length + block.indexOf("Brand: ") + 7);
  };

  const buttonClass =
    "flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95";

  return (
    <div className={cn("rounded-lg border border-input bg-background overflow-hidden", className)}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/60 bg-muted/30">
        <button type="button" onClick={() => wrapSelection("**")} className={buttonClass} title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => prefixLines(() => "## ")} className={buttonClass} title="Heading">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => prefixLines(() => "- ")} className={buttonClass} title="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => prefixLines((i) => `${i + 1}. `)} className={buttonClass} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertSpecsTable} className={buttonClass} title="Insert specs table">
          <Table className="h-4 w-4" />
        </button>
        <span className="ml-auto text-[10px] text-muted-foreground pr-1 hidden sm:inline">Tip: "Label: Value" lines become a table</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          // Preserve formatting from ChatGPT/markdown sources, including tables.
          const html = e.clipboardData.getData("text/html");
          const pasted = e.clipboardData.getData("text/plain");
          if (!pasted && !html) return;
          e.preventDefault();
          const ta = ref.current;
          if (!ta) return;

          let normalized = pasted || "";

          // If HTML contains a table, convert to "Label: Value" lines.
          if (html && /<table/i.test(html)) {
            try {
              const doc = new DOMParser().parseFromString(html, "text/html");
              const tableLines: string[] = [];
              doc.querySelectorAll("table").forEach((table) => {
                table.querySelectorAll("tr").forEach((tr) => {
                  const cells = tr.querySelectorAll("th, td");
                  if (cells.length >= 2) {
                    const label = (cells[0].textContent || "").trim();
                    const val = (cells[1].textContent || "").trim();
                    if (label && val) tableLines.push(`${label}: ${val}`);
                  }
                });
              });
              if (tableLines.length) {
                // Replace any markdown-table syntax in the plain text with our spec lines
                normalized = (pasted || "")
                  .split("\n")
                  .filter((l) => !/^\s*\|/.test(l) && !/^\s*\|?\s*-{2,}/.test(l))
                  .join("\n")
                  .trim();
                normalized = `${normalized ? normalized + "\n\n" : ""}${tableLines.join("\n")}`;
              }
            } catch {
              // ignore, fall through to plain
            }
          }

          // Normalize markdown variants
          normalized = normalized
            .replace(/\r\n/g, "\n")
            .replace(/^###\s+/gm, "## ")
            .replace(/^####\s+/gm, "## ")
            .replace(/^\s*[•·●○]\s+/gm, "- ")
            .replace(/^\s*\*\s+(?!\*)/gm, "- ")
            // Convert markdown pipe tables ("| Label | Value |") to "Label: Value"
            .replace(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|.*$/gm, (_m, a: string, b: string) => {
              const aT = a.trim();
              const bT = b.trim();
              if (!aT || !bT || /^-+$/.test(aT) || /^-+$/.test(bT)) return "";
              if (/^(label|attribute|spec|specification|feature|name)$/i.test(aT) && /^(value|detail|details)$/i.test(bT)) return "";
              return `${aT}: ${bT}`;
            })
            .replace(/\n{3,}/g, "\n\n");

          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const next = value.slice(0, start) + normalized + value.slice(end);
          onChange(next);
          const pos = start + normalized.length;
          focusAt(pos, pos);
        }}
        placeholder={placeholder || "Describe your item in detail.\n\nUse the specs table button or type lines like:\nCapacity: 512GB\nCondition: Brand New\nWarranty: 1 Year"}
        className="w-full min-h-[180px] px-3 py-3 text-base bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-y leading-relaxed"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
};

export default RichDescriptionEditor;
