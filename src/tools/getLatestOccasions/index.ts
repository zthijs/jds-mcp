import { fetchListing } from "@/jds/client";
import type { ToolDefinition } from "@/types";
import {
  type GetLatestOccasionsInput,
  type GetLatestOccasionsOutput,
  getLatestOccasionsInputSchema,
  getLatestOccasionsOutputSchema,
} from "./schema";

// The site's own "Nieuwste occasion's" sidebar skips some recent cars, so
// rank the full stock by id instead (ids are assigned as cars are added).
export const getLatestOccasions = async ({
  limit,
}: GetLatestOccasionsInput): Promise<GetLatestOccasionsOutput> => {
  const { occasions } = await fetchListing();
  return {
    totalInStock: occasions.length,
    occasions: occasions.toSorted((a, b) => b.id - a.id).slice(0, limit),
  };
};

export const getLatestOccasionsTool: ToolDefinition<
  typeof getLatestOccasionsInputSchema,
  typeof getLatestOccasionsOutputSchema
> = {
  name: "get_latest_occasions",
  title: "Get latest occasions",
  description:
    "Get the used cars most recently added to the stock of Autocentrum JDS, newest first.",
  inputSchema: getLatestOccasionsInputSchema,
  outputSchema: getLatestOccasionsOutputSchema,
  handler: getLatestOccasions,
};
