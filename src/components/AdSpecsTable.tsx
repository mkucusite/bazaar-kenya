import { formatAttributeValue, getFieldsForCategory } from "@/lib/category-fields";

interface AdSpecsTableProps {
  attributes: Record<string, unknown> | null | undefined;
  categoryName?: string | null;
  subcategoryName?: string | null;
  condition?: string | null;
  brand?: string | null;
  className?: string;
}

/**
 * PigiaMe-style two-column specs table for the ad detail page.
 * Reads ad.attributes JSONB and renders human-friendly labels.
 */
const AdSpecsTable = ({ attributes, categoryName, subcategoryName, condition, className }: AdSpecsTableProps) => {
  const fields = getFieldsForCategory(categoryName || "", subcategoryName || "");
  const attrs = (attributes && typeof attributes === "object" ? attributes : {}) as Record<string, unknown>;

  // Build display rows: condition first if present, then any field that has a value.
  const rows: { label: string; value: string }[] = [];
  if (condition && condition.trim()) {
    rows.push({ label: "Condition", value: condition });
  }

  for (const field of fields) {
    const raw = attrs[field.key];
    if (raw === undefined || raw === null || raw === "") continue;
    rows.push({ label: field.label, value: formatAttributeValue(field, raw) });
  }

  // Include any extra attributes not covered by the field config (forward-compat).
  const knownKeys = new Set(fields.map((f) => f.key));
  for (const [key, value] of Object.entries(attrs)) {
    if (knownKeys.has(key) || value === undefined || value === null || value === "") continue;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    rows.push({ label, value: String(value) });
  }

  if (rows.length === 0) return null;

  return (
    <div className={`rounded-xl border border-border/60 overflow-hidden bg-card ${className || ""}`}>
      <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
        <h3 className="font-heading font-semibold text-sm text-foreground">Details</h3>
      </div>
      <dl className="divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-2 gap-3 px-4 py-2.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-foreground break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default AdSpecsTable;
