import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { mockSite } from "../../test/mockSite";
import { registerTools } from ".";
import { compareOccasionsTool } from "./compareOccasions";
import { getLatestOccasionsTool } from "./getLatestOccasions";
import { getOccasionTool } from "./getOccasion";
import { listFilterOptionsTool } from "./listFilterOptions";
import { searchOccasionsTool } from "./searchOccasions";

// Runs every tool through a real MCP client/server pair, so the SDK validates
// arguments and structured results against the declared schemas.
const server = new McpServer({ name: "test", version: "0.0.0" });
registerTools(server);
const client = new Client({ name: "test-client", version: "0.0.0" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await Promise.all([
  server.connect(serverTransport),
  client.connect(clientTransport),
]);

const fetchMock = mockSite();
beforeEach(() => {
  fetchMock.mockClear();
});
afterAll(async () => {
  fetchMock.mockRestore();
  await client.close();
});

interface CallableTool<Input extends z.ZodObject, Output extends z.ZodObject> {
  name: string;
  inputSchema: Input;
  outputSchema: Output;
}

const callTool = <Input extends z.ZodObject, Output extends z.ZodObject>(
  tool: CallableTool<Input, Output>,
  args: z.input<Input>,
) => client.callTool({ name: tool.name, arguments: args });

const textOf = (result: Awaited<ReturnType<typeof callTool>>): string =>
  result.content.map((c) => (c.type === "text" ? c.text : "")).join("");

/** Calls a tool that must succeed and returns its typed structured result. */
const call = async <Input extends z.ZodObject, Output extends z.ZodObject>(
  tool: CallableTool<Input, Output>,
  args: z.input<Input>,
): Promise<z.output<Output>> => {
  const result = await callTool(tool, args);
  if (result.isError) throw new Error(`${tool.name} failed: ${textOf(result)}`);
  expect(JSON.parse(textOf(result))).toEqual(result.structuredContent);
  return tool.outputSchema.parse(result.structuredContent);
};

/** Calls a tool that must fail and returns its error message. */
const callError = async <Input extends z.ZodObject, Output extends z.ZodObject>(
  tool: CallableTool<Input, Output>,
  args: z.input<Input>,
): Promise<string> => {
  const result = await callTool(tool, args);
  expect(result.isError).toBe(true);
  return textOf(result);
};

const requestedUrls = () =>
  fetchMock.mock.calls.map(([input]) => String(input));

test("lists all tools with input and output schemas", async () => {
  const { tools } = await client.listTools();
  expect(tools.map((t) => t.name).sort()).toEqual([
    "compare_occasions",
    "get_latest_occasions",
    "get_occasion",
    "list_filter_options",
    "search_occasions",
  ]);
  for (const tool of tools) {
    expect(tool.outputSchema?.type).toBe("object");
    expect(tool.annotations?.readOnlyHint).toBe(true);
  }
  const search = tools.find((t) => t.name === "search_occasions");
  expect(search?.inputSchema.required ?? []).toEqual([]);
});

describe("search_occasions", () => {
  test("returns the first page of all stock by default", async () => {
    const data = await call(searchOccasionsTool, {});
    expect(data).toMatchObject({ total: 76, offset: 0, hasMore: true });
    expect(data.occasions).toHaveLength(20);
    expect(data.siteUrl).toBe("https://www.autocentrumjds.nl/occasions/");
  });

  test("passes site-supported filters through as query params", async () => {
    const data = await call(searchOccasionsTool, {
      brand: "Mercedes Benz",
      fuel: "petrol",
      transmission: "automatic",
      minYear: 2015,
      maxPrice: 20000,
    });
    const siteUrl = new URL(data.siteUrl);
    expect(Object.fromEntries(siteUrl.searchParams)).toEqual({
      "filter[merk]": "mercedes-benz",
      "filter[brandstof]": "B",
      "filter[transmissie]": "A",
      "filter[min_bouwjaar]": "2015",
      "filter[max_prijs]": "20000",
    });
    expect(requestedUrls()).toContain(siteUrl.href);
  });

  test("applies local filters, sorting and paging", async () => {
    const data = await call(searchOccasionsTool, {
      minPrice: 5000,
      maxMileageKm: 100000,
      sort: "price_desc",
      limit: 3,
      offset: 1,
    });
    expect(data).toMatchObject({ total: 16, offset: 1, hasMore: true });
    // Equal prices keep the site's order (341 BMW precedes 485 Mercedes).
    expect(data.occasions).toMatchObject([
      { id: 485, priceEur: 19950 },
      { id: 439, priceEur: 18950 },
      { id: 414, priceEur: 16950 },
    ]);
  });

  test("matches all query words, ignoring case and accents", async () => {
    const data = await call(searchOccasionsTool, { query: "RENAULT scenic" });
    expect(data.total).toBe(1);
    expect(data.occasions).toMatchObject([{ id: 488 }]);
  });

  test("returns an empty result for a brand without stock", async () => {
    const data = await call(searchOccasionsTool, { brand: "mazda" });
    expect(data).toMatchObject({ total: 0, hasMore: false, occasions: [] });
  });

  test("rejects an unknown brand with the list of known ones", async () => {
    const error = await callError(searchOccasionsTool, { brand: "tesla" });
    expect(error).toContain('Unknown brand "tesla"');
    expect(error).toContain("volkswagen");
  });

  test("rejects an inverted year range", async () => {
    const error = await callError(searchOccasionsTool, {
      minYear: 2020,
      maxYear: 2010,
    });
    expect(error).toContain("minYear must not be greater than maxYear");
  });
});

describe("get_occasion", () => {
  test("returns full details", async () => {
    const data = await call(getOccasionTool, { id: 502 });
    expect(data).toMatchObject({ id: 502, fuel: "petrol", powerHp: 86 });
  });

  test("reports an unknown id as a tool error", async () => {
    const error = await callError(getOccasionTool, { id: 99999 });
    expect(error).toContain("Occasion 99999 not found");
  });
});

describe("compare_occasions", () => {
  test("returns compact details in the requested order", async () => {
    const data = await call(compareOccasionsTool, { ids: [333, 502] });
    expect(data.occasions).toMatchObject([{ id: 333 }, { id: 502 }]);
    expect(data.occasions[1]).not.toHaveProperty("images");
    expect(data.occasions[1]?.imageUrl).toContain("audi_a1_57198103_001.jpg");
  });

  test("rejects duplicate ids", async () => {
    const error = await callError(compareOccasionsTool, { ids: [502, 502] });
    expect(error).toContain("ids must be unique");
  });
});

test("get_latest_occasions returns the highest ids first", async () => {
  const data = await call(getLatestOccasionsTool, { limit: 3 });
  expect(data.totalInStock).toBe(76);
  expect(data.occasions).toMatchObject([{ id: 516 }, { id: 515 }, { id: 514 }]);
});

test("list_filter_options maps codes and counts stock per brand", async () => {
  const data = await call(listFilterOptionsTool, {});
  expect(data.totalInStock).toBe(76);
  expect(data.brands).toContainEqual({
    slug: "ford",
    name: "Ford",
    inStock: 9,
  });
  expect(data.brands).toContainEqual({
    slug: "mazda",
    name: "Mazda",
    inStock: 0,
  });
  expect(data.fuels).toEqual([
    { value: "petrol", label: "Benzine" },
    { value: "diesel", label: "Diesel" },
    { value: "electric", label: "Electrisch" },
  ]);
  expect(data.transmissions).toEqual([
    { value: "manual", label: "Handgeschakeld" },
    { value: "automatic", label: "Automaat" },
  ]);
  expect(data.years).toEqual({ min: 2000, max: 2022 });
});
