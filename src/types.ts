import type { z } from "zod";

export interface ToolDefinition<
  Input extends z.ZodObject,
  Output extends z.ZodObject,
> {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  outputSchema: Output;
  handler: (input: z.output<Input>) => Promise<z.output<Output>>;
}
