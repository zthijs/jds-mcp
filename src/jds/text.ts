/** Collapses whitespace (including &nbsp;) and trims. */
export const cleanText = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

/** Lowercases and strips accents so "Scénic" matches "scenic". */
export const normalizeForSearch = (text: string): string =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** "Mercedes-Benz" → "mercedes-benz", "Citroën" → "citroen". */
export const slugify = (text: string): string =>
  normalizeForSearch(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** First integer in the text, ignoring Dutch thousands separators: "€ 11.950,00" → 11950. */
export const parseInteger = (
  text: string | null | undefined,
): number | null => {
  const match = text?.match(/\d[\d.]*/);
  return match ? Number.parseInt(match[0].replaceAll(".", ""), 10) : null;
};

/** First decimal number in the text: "5,1 L. / 100 KM." → 5.1. */
export const parseDecimal = (
  text: string | null | undefined,
): number | null => {
  const match = text?.match(/\d+(?:[.,]\d+)?/);
  return match ? Number.parseFloat(match[0].replace(",", ".")) : null;
};

/** Integer from the first capture group of `pattern`. */
export const matchInteger = (
  text: string | null | undefined,
  pattern: RegExp,
): number | null => parseInteger(text?.match(pattern)?.[1]);
