import { z } from "zod";
import { occasionSummarySchema } from "@/jds/schemas";

export const getLatestOccasionsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe("How many of the newest occasions to return"),
});

export type GetLatestOccasionsInput = z.output<
  typeof getLatestOccasionsInputSchema
>;

export const getLatestOccasionsOutputSchema = z.object({
  totalInStock: z.number().int(),
  occasions: z.array(occasionSummarySchema).describe("Newest first"),
});

export type GetLatestOccasionsOutput = z.output<
  typeof getLatestOccasionsOutputSchema
>;
