import { fetchListing } from "@/jds/client";
import type { OccasionSummary } from "@/jds/schemas";
import { normalizeForSearch, slugify } from "@/jds/text";
import { buildListingUrl, type SiteFilters } from "@/jds/urls";
import type { ToolDefinition } from "@/types";
import {
  type SearchOccasionsInput,
  type SearchOccasionsOutput,
  type SORT_OPTIONS,
  searchOccasionsInputSchema,
  searchOccasionsOutputSchema,
} from "./schema";

type Sort = (typeof SORT_OPTIONS)[number];
type Comparator = (a: OccasionSummary, b: OccasionSummary) => number;

/** Occasions without the sorted field always go last. */
const by =
  (
    field: "priceEur" | "year" | "mileageKm",
    direction: "asc" | "desc",
  ): Comparator =>
  (a, b) => {
    const x = a[field];
    const y = b[field];
    if (x === null) return y === null ? 0 : 1;
    if (y === null) return -1;
    return direction === "asc" ? x - y : y - x;
  };

const COMPARATORS: Record<Exclude<Sort, "site">, Comparator> = {
  // Ids are assigned incrementally as cars are added.
  newest: (a, b) => b.id - a.id,
  price_asc: by("priceEur", "asc"),
  price_desc: by("priceEur", "desc"),
  year_desc: by("year", "desc"),
  year_asc: by("year", "asc"),
  mileage_asc: by("mileageKm", "asc"),
  mileage_desc: by("mileageKm", "desc"),
};

/** Maps a brand name or slug to the slug the site's `filter[merk]` expects. */
const resolveBrandSlug = async (brand: string): Promise<string> => {
  const slug = slugify(brand);
  const { form } = await fetchListing();
  const option = form.brands.find(
    ({ value, label }) => value === slug || slugify(label) === slug,
  );
  if (!option) {
    const known = form.brands.map(({ value }) => value).join(", ");
    throw new Error(`Unknown brand "${brand}". Known brands: ${known}`);
  }
  return option.value;
};

export const searchOccasions = async ({
  brand,
  fuel,
  transmission,
  minYear,
  maxYear,
  minPrice,
  maxPrice,
  maxMileageKm,
  query,
  sort,
  limit,
  offset,
}: SearchOccasionsInput): Promise<SearchOccasionsOutput> => {
  const siteFilters: SiteFilters = {
    brand: brand === undefined ? undefined : await resolveBrandSlug(brand),
    fuel,
    transmission,
    minYear,
    maxYear,
    maxPrice,
  };
  const { occasions } = await fetchListing(siteFilters);

  // Filters the site doesn't support are applied locally.
  const terms = normalizeForSearch(query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const matches = occasions.filter(
    (o) =>
      (minPrice === undefined ||
        (o.priceEur !== null && o.priceEur >= minPrice)) &&
      (maxMileageKm === undefined ||
        (o.mileageKm !== null && o.mileageKm <= maxMileageKm)) &&
      terms.every((term) => normalizeForSearch(o.title).includes(term)),
  );
  if (sort !== "site") matches.sort(COMPARATORS[sort]);

  return {
    total: matches.length,
    offset,
    hasMore: offset + limit < matches.length,
    siteUrl: buildListingUrl(siteFilters),
    occasions: matches.slice(offset, offset + limit),
  };
};

export const searchOccasionsTool: ToolDefinition<
  typeof searchOccasionsInputSchema,
  typeof searchOccasionsOutputSchema
> = {
  name: "search_occasions",
  title: "Search occasions",
  description:
    "Search the used cars (occasions) currently in stock at Autocentrum JDS (autocentrumjds.nl) by brand, fuel, transmission, year, price, mileage and title keywords. Returns summaries; use get_occasion for full specs.",
  inputSchema: searchOccasionsInputSchema,
  outputSchema: searchOccasionsOutputSchema,
  handler: searchOccasions,
};
