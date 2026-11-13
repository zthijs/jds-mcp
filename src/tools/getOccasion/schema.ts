import { z } from "zod";
import { occasionDetailsSchema } from "@/jds/schemas";

export const occasionIdSchema = z
  .number()
  .int()
  .positive()
  .describe(
    "Occasion id from search results, or the number in a detail URL (/occasions/502/... → 502)",
  );

export const getOccasionInputSchema = z.object({
  id: occasionIdSchema,
});

export type GetOccasionInput = z.output<typeof getOccasionInputSchema>;

export const getOccasionOutputSchema = occasionDetailsSchema;

export type GetOccasionOutput = z.output<typeof getOccasionOutputSchema>;
