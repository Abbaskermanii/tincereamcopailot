import DOMPurify from "dompurify";

/**
 * Defense-in-depth HTML sanitization for rendered article/product body content.
 *
 * - Server-side: strips <script>, <style>, on* handlers, javascript: URLs
 * - Client-side: full DOMPurify with strict allowlist
 *
 * Backend nh3 sanitization is the primary filter; this is a safety net.
 */

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote",
  "a", "img", "figure", "figcaption",
  "span", "div", "table", "thead", "tbody", "tr", "th", "td",
  "pre", "code",
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  span: ["class"],
  div: ["class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

function serverSanitize(html: string): string {
  // Minimal server-side sanitization (no DOM available)
  let cleaned = html;
  // Remove script/style/iframe/object/embed
  cleaned = cleaned.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, "");
  cleaned = cleaned.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");
  // Remove event handlers
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "");
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s"'>]+/gi, "");
  // Remove javascript: URLs
  cleaned = cleaned.replace(/javascript\s*:/gi, "");
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, "");
  return cleaned;
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return serverSanitize(html);
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR as unknown as DOMPurify.Config["ALLOWED_ATTR"],
    ALLOW_DATA_ATTR: false,
  });
}
