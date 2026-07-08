export interface Translation {
  code: string;
  name: string;
  /** Whether the text includes inline Strong's numbers */
  strongs: boolean;
}

export const TRANSLATIONS: Translation[] = [
  { code: "KJV", name: "King James Version", strongs: true },
  { code: "WEB", name: "World English Bible", strongs: false },
  { code: "ASV", name: "American Standard Version", strongs: true },
  { code: "YLT", name: "Young's Literal Translation", strongs: false },
  { code: "LSV", name: "Literal Standard Version", strongs: false },
  { code: "BSB", name: "Berean Standard Bible", strongs: false },
  { code: "GNV", name: "Geneva Bible (1599)", strongs: false },
  { code: "DRB", name: "Douay-Rheims Bible", strongs: false },
];

export const DEFAULT_TRANSLATION = "KJV";

export function isValidTranslation(code: string): boolean {
  return TRANSLATIONS.some((t) => t.code === code);
}

export function getTranslation(code: string): Translation {
  return TRANSLATIONS.find((t) => t.code === code) ?? TRANSLATIONS[0];
}
