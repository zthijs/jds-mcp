import { fetchOccasion } from "@/jds/client";
import type { ToolDefinition } from "@/types";
import {
  type CompareOccasionsInput,
  type CompareOccasionsOutput,
  compareOccasionsInputSchema,
  compareOccasionsOutputSchema,
} from "./schema";

export const compareOccasions = async ({
  ids,
}: CompareOccasionsInput): Promise<CompareOccasionsOutput> => {
  const occasions = await Promise.all(ids.map(fetchOccasion));
  return {
    occasions: occasions.map(({ images, specs: _, ...details }) => ({
      ...details,
      imageUrl: images[0] ?? null,
    })),
  };
};

export const compareOccasionsTool: ToolDefinition<
  typeof compareOccasionsInputSchema,
  typeof compareOccasionsOutputSchema
> = {
  name: "compare_occasions",
  title: "Compare occasions",
  description:
    "Compare 2–5 used cars at Autocentrum JDS side by side: price, mileage, year, fuel, transmission, power, consumption, APK, VAT status and accessories.",
  inputSchema: compareOccasionsInputSchema,
  outputSchema: compareOccasionsOutputSchema,
  handler: compareOccasions,
};
