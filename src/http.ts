import { timingSafeEqual } from "node:crypto";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { SERVER_NAME, SERVER_VERSION } from "./constant";
import { registerTools } from "./tools";

// Streamable HTTP entry point for hosted deployments (see Dockerfile);
// `main.ts` stays the stdio entry for local clients.
const PORT = Number(process.env.PORT ?? 3000);
const MCP_PATH = "/mcp";
/** Optional bearer token; when set, every MCP request must carry it. */
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

const handler = createMcpHandler(
  () => {
    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });
    registerTools(server);
    return server;
  },
  { onerror: (error) => console.error("MCP error:", error) },
);

const isAuthorized = (request: Request): boolean => {
  if (!AUTH_TOKEN) return true;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${AUTH_TOKEN}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

const server = Bun.serve({
  port: PORT,
  // SSE streams stay open longer than Bun's default 10 s idle timeout.
  idleTimeout: 0,
  fetch: (request) => {
    const { pathname } = new URL(request.url);
    if (pathname === "/health") return Response.json({ status: "ok" });
    if (pathname !== MCP_PATH)
      return new Response("Not found", { status: 404 });
    if (!isAuthorized(request)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      });
    }
    return handler.fetch(request);
  },
});

const shutdown = () => {
  void handler
    .close()
    .then(() => server.stop())
    .finally(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.error(
  `${SERVER_NAME} listening on http://localhost:${server.port}${MCP_PATH}` +
    (AUTH_TOKEN ? " (bearer auth on)" : ""),
);
