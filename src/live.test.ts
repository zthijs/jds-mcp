import { describe, expect, test } from "bun:test";
import { fetchListing, fetchOccasion } from "./jds/client";
import { occasionDetailsSchema, occasionSummarySchema } from "./jds/schemas";
import { searchOccasions } from "./tools/searchOccasions";
import { searchOccasionsInputSchema } from "./tools/searchOccasions/schema";

// Hits autocentrumjds.nl to catch markup changes; run with `bun run test:live`.
// The site takes several seconds to render its listing.
const TIMEOUT_MS = 30_000;

describe.skipIf(!process.env.JDS_LIVE)("live site", () => {
  test(
    "listing parses into valid summaries",
    async () => {
      const { occasions, form } = await fetchListing();
      expect(occasions.length).toBeGreaterThan(0);
      expect(form.brands.length).toBeGreaterThan(0);
      for (const occasion of occasions) {
        occasionSummarySchema.parse(occasion);
        expect(occasion.priceEur).not.toBeNull();
        expect(occasion.brand).not.toBeNull();
      }
    },
    TIMEOUT_MS,
  );

  test(
    "site-side filters narrow the results",
    async () => {
      const all = await searchOccasions(searchOccasionsInputSchema.parse({}));
      const automatic = await searchOccasions(
        searchOccasionsInputSchema.parse({ transmission: "automatic" }),
      );
      expect(automatic.total).toBeGreaterThan(0);
      expect(automatic.total).toBeLessThan(all.total);
    },
    TIMEOUT_MS,
  );

  test(
    "the newest occasion parses into valid details",
    async () => {
      const { occasions } = await fetchListing();
      const newest = Math.max(...occasions.map((o) => o.id));
      const details = occasionDetailsSchema.parse(await fetchOccasion(newest));
      expect(details.priceEur).not.toBeNull();
      expect(details.images.length).toBeGreaterThan(0);
    },
    TIMEOUT_MS,
  );
});
