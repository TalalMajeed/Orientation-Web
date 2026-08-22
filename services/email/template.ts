export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PLACEHOLDER = /\{([a-z0-9_]+)\}/g;

export type BodyFormat = "text" | "html";

export const BODY_FORMATS: BodyFormat[] = ["text", "html"];

export function isBodyFormat(candidate: unknown): candidate is BodyFormat {
  return typeof candidate === "string" && (BODY_FORMATS as string[]).includes(candidate);
}

export function normalizeColumnName(raw: string): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_]+/g, "")
    .trim()
    .replace(/[\s_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeColumnNames(headers: unknown[]): string[] {
  const used = new Set<string>();

  return headers.map((header, index) => {
    const base = normalizeColumnName(String(header ?? "")) || `column_${index + 1}`;
    let name = base;
    let suffix = 2;

    while (used.has(name)) {
      name = `${base}_${suffix}`;
      suffix += 1;
    }

    used.add(name);

    return name;
  });
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extractPlaceholders(template: string): string[] {
  return Array.from(new Set(Array.from(template.matchAll(PLACEHOLDER), (match) => match[1])));
}

export function unknownPlaceholders(template: string, columns: string[]): string[] {
  const known = new Set(columns);

  return extractPlaceholders(template).filter((name) => !known.has(name));
}

function substitute(
  template: string,
  values: Record<string, string>,
  transform: (value: string) => string
): string {
  return template.replace(PLACEHOLDER, (_match, name: string) =>
    transform(values[name] ?? "")
  );
}

export function renderSubject(template: string, values: Record<string, string>): string {
  return substitute(template, values, (value) => value).replace(/\s+/g, " ").trim();
}

export function renderBodyHtml(template: string, values: Record<string, string>): string {
  const filled = substitute(escapeHtml(template), values, (value) => escapeHtml(value));

  return [
    '<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#132647">',
    filled.replace(/\r\n|\r|\n/g, "<br />"),
    "</div>",
  ].join("");
}

export function renderBodyText(template: string, values: Record<string, string>): string {
  return substitute(template, values, (value) => value);
}

export function renderBodyMarkup(template: string, values: Record<string, string>): string {
  return substitute(template, values, (value) => escapeHtml(value));
}

export function renderEmailHtml(
  format: BodyFormat,
  template: string,
  values: Record<string, string>
): string {
  return format === "html"
    ? renderBodyMarkup(template, values)
    : renderBodyHtml(template, values);
}
