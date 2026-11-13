import { type HTMLElement, parse } from "node-html-parser";
import type { OccasionSummary } from "./schemas";
import {
  cleanText,
  matchInteger,
  normalizeForSearch,
  parseInteger,
} from "./text";
import { occasionUrl, toAbsoluteUrl } from "./urls";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ListingPage {
  occasions: OccasionSummary[];
  /** Options of the search form's `<select>`s; `value` is what the site expects in `filter[...]`. */
  form: {
    brands: SelectOption[];
    fuels: SelectOption[];
    transmissions: SelectOption[];
    years: number[];
    priceSteps: number[];
  };
}

const selectOptions = (root: HTMLElement, name: string): SelectOption[] =>
  root
    .querySelectorAll(`select[name="filter[${name}]"] option`)
    .map((option) => ({
      value: option.getAttribute("value") ?? "",
      label: cleanText(option.text),
    }))
    // The first option is the "Kies een ..." placeholder.
    .filter((option) => option.value !== "");

const numericOptions = (root: HTMLElement, name: string): number[] =>
  selectOptions(root, name)
    .map((option) => parseInteger(option.value))
    .filter((value) => value !== null);

/** Titles start with the brand name, e.g. "Mercedes-Benz A-Klasse 180". */
const brandFromTitle = (
  title: string,
  brands: SelectOption[],
): string | null => {
  const normalizedTitle = normalizeForSearch(title);
  const matches = brands.filter(({ label }) => {
    const brand = normalizeForSearch(label);
    return normalizedTitle === brand || normalizedTitle.startsWith(`${brand} `);
  });
  // Prefer the longest match should one brand name prefix another.
  matches.sort((a, b) => b.label.length - a.label.length);
  return matches[0]?.label ?? null;
};

const parseOccasionItem = (
  item: HTMLElement,
  brands: SelectOption[],
): OccasionSummary | null => {
  const id = matchInteger(item.id, /occasions-listitem-(\d+)/);
  const link = item.querySelector(".info h2 a");
  if (id === null || !link) return null;

  const title = cleanText(link.text);
  const specs = cleanText(item.querySelector(".specs")?.text ?? "");
  const href = item.getAttribute("data-target") ?? link.getAttribute("href");
  const imageSrc = item.querySelector(".image img")?.getAttribute("src");

  return {
    id,
    title,
    brand: brandFromTitle(title, brands),
    year: matchInteger(specs, /bouwjaar\s*(\d{4})/i),
    mileageKm: matchInteger(specs, /\bkm\s*([\d.]+)/i),
    priceEur: parseInteger(item.querySelector(".prijs")?.text),
    url: href ? toAbsoluteUrl(href) : occasionUrl(id),
    imageUrl: imageSrc ? toAbsoluteUrl(imageSrc) : null,
  };
};

export const parseListingPage = (html: string): ListingPage => {
  const root = parse(html);
  const brands = selectOptions(root, "merk");

  return {
    // `div` excludes the `li` items of the "Nieuwste occasion's" sidebar.
    occasions: root
      .querySelectorAll("div.occasions-listitem")
      .map((item) => parseOccasionItem(item, brands))
      .filter((occasion) => occasion !== null),
    form: {
      brands,
      fuels: selectOptions(root, "brandstof"),
      transmissions: selectOptions(root, "transmissie"),
      years: numericOptions(root, "min_bouwjaar"),
      priceSteps: numericOptions(root, "max_prijs"),
    },
  };
};
