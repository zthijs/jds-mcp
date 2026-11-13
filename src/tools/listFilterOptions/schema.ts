import { z } from "zod";
import { fuelSchema, transmissionSchema } from "@/jds/schemas";

export const listFilterOptionsInputSchema = z.object({});

const optionSchema = <Value extends z.ZodType>(value: Value) =>
  z.object({
    value,
    label: z.string().describe("Label on the site, in Dutch"),
  });

export const listFilterOptionsOutputSchema = z.object({
  totalInStock: z.number().int(),
  brands: z
    .array(
      z.object({
        slug: z.string().describe("Accepted by search_occasions' brand"),
        name: z.string(),
        inStock: z.number().int().describe("Occasions currently in stock"),
      }),
    )
    .describe(
      "Every brand the site's search form offers, including sold-out ones",
    ),
  fuels: z.array(optionSchema(fuelSchema)),
  transmissions: z.array(optionSchema(transmissionSchema)),
  years: z
    .object({ min: z.number().int(), max: z.number().int() })
    .nullable()
    .describe("Year range of the site's dropdowns; other years work too"),
  priceSteps: z
    .array(z.number().int())
    .describe("Budget steps of the site's dropdown; any maxPrice works"),
});

export type ListFilterOptionsOutput = z.output<
  typeof listFilterOptionsOutputSchema
>;
