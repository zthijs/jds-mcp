import type { McpServer } from "@modelcontextprotocol/server";
import { compareOccasionsTool } from "./compareOccasions";
import { getLatestOccasionsTool } from "./getLatestOccasions";
import { getOccasionTool } from "./getOccasion";
import { listFilterOptionsTool } from "./listFilterOptions";
import { registerTool } from "./registerTool";
import { searchOccasionsTool } from "./searchOccasions";

export const registerTools = (server: McpServer): void => {
  registerTool(server, searchOccasionsTool);
  registerTool(server, getOccasionTool);
  registerTool(server, compareOccasionsTool);
  registerTool(server, getLatestOccasionsTool);
  registerTool(server, listFilterOptionsTool);
};
