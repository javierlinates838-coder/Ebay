export type Segment =
  | { kind: "text"; text: string; bold?: boolean; strongs?: string[] }
  | { kind: "note"; text: string }
  | { kind: "break" };

/**
 * Tokenizes raw verse markup from the Bible text API into renderable segments.
 *
 * The source text uses lightweight tags:
 *   `<S>1063</S>`  — Strong's number attached to the preceding word(s)
 *   `<sup>…</sup>` — translator footnote
 *   `<b>…</b>`     — bold (e.g. psalm titles)
 *   `<br/>`        — line break (poetry)
 * Everything else is stripped.
 */
export function parseVerseText(raw: string): Segment[] {
  const segments: Segment[] = [];
  let bold = false;

  const push = (text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.kind === "text" && !last.strongs && !!last.bold === bold) {
      last.text += text;
    } else {
      segments.push({ kind: "text", text, bold: bold || undefined });
    }
  };

  const tagRe = /<S>(\d+)<\/S>|<sup>([\s\S]*?)<\/sup>|<br\s*\/?>|<(\/?)(b|strong)>|<[^>]+>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(raw)) !== null) {
    push(raw.slice(lastIndex, match.index));
    lastIndex = tagRe.lastIndex;

    if (match[1] !== undefined) {
      // Strong's number: attach to the most recent text segment.
      const last = segments[segments.length - 1];
      if (last && last.kind === "text") {
        last.strongs = [...(last.strongs ?? []), match[1]];
      }
    } else if (match[2] !== undefined) {
      const note = match[2].replace(/<[^>]+>/g, "").trim();
      if (note) segments.push({ kind: "note", text: note });
    } else if (/^<br/i.test(match[0])) {
      segments.push({ kind: "break" });
    } else if (match[4]) {
      bold = match[3] !== "/";
    }
    // Any other tag is dropped.
  }
  push(raw.slice(lastIndex));

  // Normalize whitespace inside text segments.
  for (const seg of segments) {
    if (seg.kind === "text") seg.text = seg.text.replace(/\s+/g, " ");
  }
  return segments.filter((s) => s.kind !== "text" || s.text.trim().length > 0);
}

/** Plain reading text with all markup and footnotes removed. */
export function plainVerseText(raw: string): string {
  return raw
    .replace(/<S>\d+<\/S>/gi, "")
    .replace(/<sup>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
