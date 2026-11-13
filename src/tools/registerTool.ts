import type { McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";
import type { ToolDefinition } from "@/types";

/**
 * Registers a read-only tool. The SDK validates arguments against
 * `inputSchema` and the result against `outputSchema`; thrown errors are
 * returned to the client as `isError: true` results.
 */
export const registerTool = <
  Input extends z.ZodObject,
  Output extends z.ZodObject,
>(
  server: McpServer,
  tool: ToolDefinition<Input, Output>,
): void => {
  // Widened so the SDK's conditional callback types resolve; the handler
  // still gets its precise input type by re-parsing with `tool.inputSchema`.
  const inputSchema: z.ZodObject = tool.inputSchema;
  const outputSchema: z.ZodObject = tool.outputSchema;

  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const output = await tool.handler(tool.inputSchema.parse(args));
      const result: Record<string, unknown> = output;
      return {
        // Serialized copy for clients that don't read structuredContent.
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );
};
