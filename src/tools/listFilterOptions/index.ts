import { fetchListing } from "@/jds/client";
import type { SelectOption } from "@/jds/parseListing";
import {
  FUEL_CODES,
  fuelSchema,
  TRANSMISSION_CODES,
  transmissionSchema,
} from "@/jds/schemas";
import type { ToolDefinition } from "@/types";
import {
  type ListFilterOptionsOutput,
  listFilterOptionsInputSchema,
  listFilterOptionsOutputSchema,
} from "./schema";

/** Maps the site's codes (e.g. "B") back to our values (e.g. "petrol"), dropping unknown codes. */
const fromCodes = <Value extends string>(
  values: readonly Value[],
  codes: Record<Value, string>,
  options: SelectOption[],
): { value: Value; label: string }[] =>
  options.flatMap(({ value: code, label }) => {
    const value = values.find((v) => codes[v] === code);
    return value === undefined ? [] : [{ value, label }];
  });

export const listFilterOptions = async (): Promise<ListFilterOptionsOutput> => {
  const { occasions, form } = await fetchListing();
  return {
    totalInStock: occasions.length,
    brands: form.brands.map(({ value, label }) => ({
      slug: value,
      name: label,
      inStock: occasions.filter((o) => o.brand === label).length,
    })),
    fuels: fromCodes(fuelSchema.options, FUEL_CODES, form.fuels),
    transmissions: fromCodes(
      transmissionSchema.options,
      TRANSMISSION_CODES,
      form.transmissions,
    ),
    years: form.years.length
      ? { min: Math.min(...form.years), max: Math.max(...form.years) }
      : null,
    priceSteps: form.priceSteps,
  };
};

export const listFilterOptionsTool: ToolDefinition<
  typeof listFilterOptionsInputSchema,
  typeof listFilterOptionsOutputSchema
> = {
  name: "list_filter_options",
  title: "List filter options",
  description:
    "List the search filters Autocentrum JDS offers: brands (with how many cars of each are in stock), fuel types, transmissions, year range and budget steps.",
  inputSchema: listFilterOptionsInputSchema,
  outputSchema: listFilterOptionsOutputSchema,
  handler: listFilterOptions,
};
