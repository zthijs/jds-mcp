import { z } from "zod";
import {
  fuelSchema,
  occasionSummarySchema,
  transmissionSchema,
} from "@/jds/schemas";

const yearSchema = z.number().int().min(1900).max(2100);
const euroSchema = z.number().int().nonnegative();

export const SORT_OPTIONS = [
  "site",
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "year_asc",
  "mileage_asc",
  "mileage_desc",
] as const;

export const searchOccasionsInputSchema = z
  .object({
    brand: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Brand name or slug, e.g. 'Volkswagen' or 'mercedes-benz' (see list_filter_options)",
      ),
    fuel: fuelSchema.optional(),
    transmission: transmissionSchema.optional(),
    minYear: yearSchema.optional().describe("Minimum year of manufacture"),
    maxYear: yearSchema.optional().describe("Maximum year of manufacture"),
    minPrice: euroSchema.optional().describe("Minimum price in euros"),
    maxPrice: euroSchema.optional().describe("Maximum price in euros"),
    maxMileageKm: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Maximum odometer reading in km"),
    query: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Words that must all appear in the title (case- and accent-insensitive), e.g. 'golf tsi' or 'airco'",
      ),
    sort: z
      .enum(SORT_OPTIONS)
      .default("site")
      .describe(
        "'site' keeps the site's order (alphabetical by brand and model); 'newest' = most recently added first",
      ),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
  })
  .refine(
    ({ minYear, maxYear }) =>
      minYear === undefined || maxYear === undefined || minYear <= maxYear,
    { message: "minYear must not be greater than maxYear", path: ["minYear"] },
  )
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      message: "minPrice must not be greater than maxPrice",
      path: ["minPrice"],
    },
  );

export type SearchOccasionsInput = z.output<typeof searchOccasionsInputSchema>;

export const searchOccasionsOutputSchema = z.object({
  total: z
    .number()
    .int()
    .describe("Number of matching occasions, before limit/offset"),
  offset: z.number().int(),
  hasMore: z.boolean(),
  siteUrl: z
    .url()
    .describe(
      "This search on autocentrumjds.nl (only the filters the site supports)",
    ),
  occasions: z.array(occasionSummarySchema),
});

export type SearchOccasionsOutput = z.output<
  typeof searchOccasionsOutputSchema
>;
