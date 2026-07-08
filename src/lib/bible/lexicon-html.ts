const ALLOWED_TAGS = new Set([
  "b", "i", "em", "strong", "p", "ol", "ul", "li", "br", "a", "span", "sup", "sub",
]);

/**
 * The lexicon API returns trusted-but-messy HTML. Reduce it to a small
 * allowlist of tags, convert internal `S:G1234` links to app routes, and
 * map the Greek/Hebrew tags to styleable spans.
 */
export function sanitizeLexiconHtml(html: string): string {
  let out = html
    .replace(/<a\s+href=["']?S:([GH]?\d+)["']?\s*>/gi, '<a href="/lexicon/$1">')
    .replace(/<el>/gi, '<span data-lang="el">')
    .replace(/<\/el>/gi, "</span>")
    .replace(/<he>/gi, '<span data-lang="he">')
    .replace(/<\/he>/gi, "</span>")
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "");

  out = out.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)\/?>/g, (full, close, tag, attrs) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (close) return `</${name}>`;
    if (name === "br") return "<br/>";
    if (name === "a") {
      const href = /href="(\/lexicon\/[GH]?\d+)"/.exec(attrs)?.[1];
      return href ? `<a href="${href}">` : "<span>";
    }
    if (name === "span") {
      const lang = /data-lang="(el|he)"/.exec(attrs)?.[1];
      return lang ? `<span data-lang="${lang}">` : "<span>";
    }
    if (name === "ol") {
      const type = /type=["']?([1aAiI])["']?/.exec(attrs)?.[1];
      return type ? `<ol type="${type}">` : "<ol>";
    }
    return `<${name}>`;
  });

  return out;
}
