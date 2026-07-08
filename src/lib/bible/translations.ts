export interface Translation {
  code: string;
  name: string;
  /** Display name of the language group, in its own tongue */
  language: string;
  /** BCP-47 language tag for lang attributes and speech synthesis */
  lang: string;
  /** Right-to-left script */
  rtl?: boolean;
  /** Whether the text includes inline Strong's numbers */
  strongs: boolean;
  /** Some source texts cover only one testament */
  scope?: "OT" | "NT";
}

export const TRANSLATIONS: Translation[] = [
  // English
  { code: "KJV", name: "King James Version", language: "English", lang: "en", strongs: true },
  { code: "WEB", name: "World English Bible", language: "English", lang: "en", strongs: false },
  { code: "ASV", name: "American Standard Version", language: "English", lang: "en", strongs: true },
  { code: "YLT", name: "Young's Literal Translation", language: "English", lang: "en", strongs: false },
  { code: "LSV", name: "Literal Standard Version", language: "English", lang: "en", strongs: false },
  { code: "BSB", name: "Berean Standard Bible", language: "English", lang: "en", strongs: false },
  { code: "GNV", name: "Geneva Bible (1599)", language: "English", lang: "en", strongs: false },
  { code: "DRB", name: "Douay-Rheims Bible", language: "English", lang: "en", strongs: false },
  // Original languages
  { code: "WLC", name: "Westminster Leningrad Codex (Hebrew)", language: "Original languages", lang: "he", rtl: true, strongs: false, scope: "OT" },
  { code: "TR", name: "Textus Receptus (Greek)", language: "Original languages", lang: "el", strongs: false, scope: "NT" },
  { code: "VULG", name: "Vulgata (Latin)", language: "Original languages", lang: "la", strongs: false },
  // Español
  { code: "RV1960", name: "Reina-Valera 1960", language: "Español", lang: "es", strongs: false },
  { code: "NVI", name: "Nueva Versión Internacional", language: "Español", lang: "es", strongs: false },
  // Français
  { code: "FRLSG", name: "Louis Segond 1910", language: "Français", lang: "fr", strongs: false },
  // Deutsch
  { code: "LUT", name: "Luther Bibel 1912", language: "Deutsch", lang: "de", strongs: false },
  { code: "SCH", name: "Schlachter Bibel 1951", language: "Deutsch", lang: "de", strongs: false },
  // Português
  { code: "ARA", name: "Almeida Revista e Atualizada", language: "Português", lang: "pt", strongs: false },
  // Italiano
  { code: "NR06", name: "Nuova Riveduta 2006", language: "Italiano", lang: "it", strongs: false },
  // Nederlands
  { code: "NLD", name: "Het Boek", language: "Nederlands", lang: "nl", strongs: false },
  // Русский
  { code: "SYNOD", name: "Синодальный перевод", language: "Русский", lang: "ru", strongs: false },
  // Українська
  { code: "UBIO", name: "Біблія Огієнка 1962", language: "Українська", lang: "uk", strongs: false },
  // 中文
  { code: "CUV", name: "和合本 (Chinese Union Version)", language: "中文", lang: "zh", strongs: false },
  // 日本語
  { code: "JPKJV", name: "日本語 King James Version", language: "日本語", lang: "ja", strongs: false },
  // 한국어
  { code: "KRV", name: "개역한글 (Korean Revised Version)", language: "한국어", lang: "ko", strongs: false },
  // हिन्दी
  { code: "HIOV", name: "हिन्दी O.V. Bible", language: "हिन्दी", lang: "hi", strongs: false },
  // العربية
  { code: "SVD", name: "سميث وفانديك (Smith & Van Dyke)", language: "العربية", lang: "ar", rtl: true, strongs: false },
  // Bahasa Indonesia
  { code: "TB", name: "Terjemahan Baru", language: "Bahasa Indonesia", lang: "id", strongs: false },
  // Tiếng Việt
  { code: "VI1934", name: "Kinh Thánh 1934", language: "Tiếng Việt", lang: "vi", strongs: false },
];

export const DEFAULT_TRANSLATION = "KJV";

/** Translation groups in display order, keyed by language name. */
export const TRANSLATION_GROUPS: { language: string; translations: Translation[] }[] = (() => {
  const groups = new Map<string, Translation[]>();
  for (const t of TRANSLATIONS) {
    const list = groups.get(t.language) ?? [];
    list.push(t);
    groups.set(t.language, list);
  }
  return [...groups.entries()].map(([language, translations]) => ({ language, translations }));
})();

export const LANGUAGE_COUNT = TRANSLATION_GROUPS.length;

export function isValidTranslation(code: string): boolean {
  return TRANSLATIONS.some((t) => t.code === code);
}

export function getTranslation(code: string): Translation {
  return TRANSLATIONS.find((t) => t.code === code) ?? TRANSLATIONS[0];
}
