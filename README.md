# jds-mcp

MCP server (stdio) for the used-car stock ("occasions") of [Autocentrum JDS](https://www.autocentrumjds.nl/occasions/). It reads the site's HTML; there is no API.

## Tools

| Tool                   | What it does                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `search_occasions`     | Search the current stock by brand, fuel, transmission, year range, price range, max mileage and title keywords; sort and page the results. |
| `get_occasion`         | Full details of one car: specs, APK, VAT status, accessories, and photos.                                                                  |
| `compare_occasions`    | Details of 2–5 cars side by side (without photo galleries).                                                                                |
| `get_latest_occasions` | The most recently added cars.                                                                                                              |
| `list_filter_options`  | Brands (with stock counts), fuels, transmissions, year range and budget steps.                                                             |

Every tool declares a zod input and output schema. Results are returned as `structuredContent` (validated by the SDK) plus a JSON text copy.

### How it maps onto the site

- The listing page has no pagination: one request returns every matching car.
- Brand, fuel, transmission, year range and max price go to the site's own `?filter[...]` params (e.g. `fuel: "diesel"` → `filter[brandstof]=D`). Min price, max mileage, keywords, sorting and paging are applied locally.
- Fuel and transmission only appear on detail pages, so search results don't include them; use `get_occasion`.
- "Latest" sorts by the site's occasion id, which grows as cars are added. The site's "Nieuwste occasion's" sidebar skips some recent cars.
- Pages are cached for 5 minutes (`src/constant.ts`).

## Development

```bash
bun install
bun run dev        # run from source (stdio)
bun run dev:http   # run from source over HTTP on :3000/mcp
bun test           # unit + MCP end-to-end tests against saved pages in test/fixtures
bun run test:live  # smoke test against the live site (catches markup changes)
bun run typecheck
bun run check      # biome lint + format + organize imports (writes fixes)
bun run build      # bundles to dist/main.js
```

When the site's markup changes, refresh the fixtures in `test/fixtures/` from the live pages and update the parsers in `src/jds/`.

## Layout

- `src/jds/`: site access. HTTP with caching (`http.ts`), URLs and filter params (`urls.ts`), the listing and detail-page parsers, and the shared zod schemas (`schemas.ts`).
- `src/tools/<name>/`: one folder per tool, with `schema.ts` (zod input/output schemas; `.describe()` every field) and `index.ts` (a `ToolDefinition`).
- `src/main.ts` / `src/http.ts`: stdio and streamable HTTP entry points.
- `src/tools/index.ts`: registers the tools. Errors thrown by a handler are returned to the client as `isError: true` results.

## Using it from Claude

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "jds-mcp": {
      "command": "npx",
      "args": ["-y", "/Users/pnl14u8k/Desktop/zthijs/jds-mcp"]
    }
  }
}
```

Or with Claude Code: `claude mcp add jds-mcp -- npx -y /Users/pnl14u8k/Desktop/zthijs/jds-mcp`

Rebuild (`bun run build`) and restart the client after code changes.

## Deploying (container)

`src/http.ts` serves the same tools over streamable HTTP at `/mcp` (stateless, so it scales horizontally), with `GET /health` for probes. The `Dockerfile` runs the typecheck and tests, bundles it into a single file and ships that on a distroless Bun image (~170 MB, non-root, with a healthcheck).

```bash
docker build -t jds-mcp .
docker run -p 3000:3000 -e MCP_AUTH_TOKEN=<secret> jds-mcp
claude mcp add --transport http jds-mcp http://localhost:3000/mcp --header "Authorization: Bearer <secret>"
```

| Env var          | Default | Meaning                                                                               |
| ---------------- | ------- | ------------------------------------------------------------------------------------- |
| `PORT`           | `3000`  | Listen port.                                                                          |
| `MCP_AUTH_TOKEN` | unset   | When set, `/mcp` requires `Authorization: Bearer <token>`. Set it on anything public. |

Terminate TLS in front of it (load balancer or reverse proxy).

`.github/workflows/container.yml` lints, typechecks and tests every push and PR, builds the image and smoke-tests it (`/health` and `tools/list`), and on `main` or `v*` tags pushes a multi-arch (amd64/arm64) image to `ghcr.io/<owner>/<repo>` tagged `latest`, the commit SHA and the semver version.
