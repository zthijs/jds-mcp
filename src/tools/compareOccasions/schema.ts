import { z } from "zod";
import { occasionDetailsSchema } from "@/jds/schemas";
import { occasionIdSchema } from "../getOccasion/schema";

export const compareOccasionsInputSchema = z.object({
  ids: z
    .array(occasionIdSchema)
    .min(2)
    .max(5)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "ids must be unique",
    })
    .describe("2–5 occasion ids to compare"),
});

export type CompareOccasionsInput = z.output<
  typeof compareOccasionsInputSchema
>;

/** Details without the photo gallery and raw spec rows, to keep the comparison compact. */
export const occasionComparisonSchema = occasionDetailsSchema
  .omit({ images: true, specs: true })
  .extend({
    imageUrl: z.url().nullable().describe("Main photo"),
  });

export const compareOccasionsOutputSchema = z.object({
  occasions: z
    .array(occasionComparisonSchema)
    .describe("In the same order as the requested ids"),
});

export type CompareOccasionsOutput = z.output<
  typeof compareOccasionsOutputSchema
>;
