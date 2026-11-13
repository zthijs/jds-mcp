import { fetchHtml } from "./http";
import { type ListingPage, parseListingPage } from "./parseListing";
import { parseOccasionPage } from "./parseOccasion";
import type { OccasionDetails } from "./schemas";
import { buildListingUrl, occasionUrl, type SiteFilters } from "./urls";

/** The site has no pagination: one request returns every matching occasion. */
export const fetchListing = async (
  filters: SiteFilters = {},
): Promise<ListingPage> =>
  parseListingPage(await fetchHtml(buildListingUrl(filters)));

export const fetchOccasion = async (id: number): Promise<OccasionDetails> => {
  const occasion = parseOccasionPage(await fetchHtml(occasionUrl(id)), id);
  if (!occasion) {
    throw new Error(
      `Occasion ${id} not found; it may have been sold. Use search_occasions to see current stock.`,
    );
  }
  return occasion;
};
