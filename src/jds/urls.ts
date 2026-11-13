import { OCCASIONS_URL, SITE_URL } from "@/constant";
import {
  FUEL_CODES,
  type Fuel,
  TRANSMISSION_CODES,
  type Transmission,
} from "./schemas";

/** Filters the site applies server-side via `?filter[...]=` query params. */
export interface SiteFilters {
  /** Brand slug as used by the site, e.g. "mercedes-benz". */
  brand?: string;
  fuel?: Fuel;
  transmission?: Transmission;
  minYear?: number;
  maxYear?: number;
  maxPrice?: number;
}

export const toAbsoluteUrl = (href: string): string =>
  new URL(href, SITE_URL).href;

/** The site ignores the slug after the id, so this resolves for any occasion. */
export const occasionUrl = (id: number): string => `${OCCASIONS_URL}${id}/`;

export const buildListingUrl = (filters: SiteFilters = {}): string => {
  const params: Record<string, string | number | undefined> = {
    merk: filters.brand,
    brandstof: filters.fuel && FUEL_CODES[filters.fuel],
    transmissie:
      filters.transmission && TRANSMISSION_CODES[filters.transmission],
    min_bouwjaar: filters.minYear,
    max_bouwjaar: filters.maxYear,
    max_prijs: filters.maxPrice,
  };

  const url = new URL(OCCASIONS_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(`filter[${key}]`, String(value));
    }
  }
  return url.href;
};

/**
 * The uploaded original behind a scaled photo URL
 * (images/scale/x.jpg?path=upload/occasions/&width=1000…), at full resolution.
 */
export const originalPhotoUrl = (scaledUrl: string): string => {
  const url = new URL(scaledUrl);
  const path = url.searchParams.get("path");
  const file = url.pathname.split("/").pop();
  return path && file ? toAbsoluteUrl(`${path}${file}`) : scaledUrl;
};
