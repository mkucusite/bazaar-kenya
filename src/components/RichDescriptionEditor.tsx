import { useRef } from "react";
import { Bold, List, ListOrdered, Heading2, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Lightweight textarea with formatting helpers (bullets, numbered lists, headings, bold).
 * Outputs plain text with markdown-like markers that render nicely on the detail page.
 */
const RichDescriptionEditor = ({ value, onChange, placeholder, className }: RichDescriptionEditorProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || "text";
    const after = value.slice(end);
    const next = `${before}${prefix}${selected}${suffix}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const prefixLines = (marker: (i: number) => string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const realEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, realEnd) || "List item";
    const lines = block.split("\n");
    const prefixed = lines.map((l, i) => (l.trim() ? `${marker(i)}${l.replace(/^([-*•]|\d+\.)\s*/, "")}` : marker(i) + "List item"));
    const next = value.slice(0, lineStart) + prefixed.join("\n") + value.slice(realEnd);
    onChange(next);
    requestAnimationFrame(() => ta.focus());
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
        <span className="ml-auto text-[10px] text-muted-foreground pr-1 hidden sm:inline">Use bullets for specs</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          // Preserve formatting from ChatGPT/markdown sources.
          const pasted = e.clipboardData.getData("text/plain");
          if (!pasted) return;
          e.preventDefault();
          const ta = ref.current;
          if (!ta) return;
          // Normalize: convert common markdown variants into our format
          const normalized = pasted
            .replace(/\r\n/g, "\n")
            // Convert "**Heading:**" or "### Heading" lines into "## Heading"
            .replace(/^###\s+/gm, "## ")
            .replace(/^####\s+/gm, "## ")
            // Convert "•" or "·" bullets to "- "
            .replace(/^\s*[•·●○]\s+/gm, "- ")
            // Convert "*" bullets to "- "
            .replace(/^\s*\*\s+(?!\*)/gm, "- ");
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const next = value.slice(0, start) + normalized + value.slice(end);
          onChange(next);
          requestAnimationFrame(() => {
            ta.focus();
            const pos = start + normalized.length;
            ta.setSelectionRange(pos, pos);
          });
        }}
        placeholder={placeholder || "Describe your item in detail.\n\nUse the bullet button to add specs:\n- Capacity: 512GB\n- Condition: Brand New\n- Warranty: 1 Year"}
        className="w-full min-h-[180px] px-3 py-3 text-base bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-y leading-relaxed"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
};

export default RichDescriptionEditor;
