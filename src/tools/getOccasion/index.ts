import { fetchOccasion } from "@/jds/client";
import type { ToolDefinition } from "@/types";
import {
  type GetOccasionInput,
  type GetOccasionOutput,
  getOccasionInputSchema,
  getOccasionOutputSchema,
} from "./schema";

export const getOccasion = ({
  id,
}: GetOccasionInput): Promise<GetOccasionOutput> => fetchOccasion(id);

export const getOccasionTool: ToolDefinition<
  typeof getOccasionInputSchema,
  typeof getOccasionOutputSchema
> = {
  name: "get_occasion",
  title: "Get occasion details",
  description:
    "Get all details of one used car at Autocentrum JDS: price, specs (fuel, transmission, body type, power, consumption, colour, ...), APK validity, VAT status, accessories and photos.",
  inputSchema: getOccasionInputSchema,
  outputSchema: getOccasionOutputSchema,
  handler: getOccasion,
};
