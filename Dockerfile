# syntax=docker/dockerfile:1

# Test and bundle the HTTP server into a single file.
FROM oven/bun:1.3 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json biome.json ./
COPY src ./src
COPY test ./test
RUN bun run typecheck && bun test && bun run build:http

# The bundle has no runtime dependencies, so ship only it.
FROM oven/bun:1.3-distroless
WORKDIR /app
COPY --from=build /app/dist/http.js ./http.js
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER 1000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["bun", "-e", "fetch(`http://localhost:${process.env.PORT}/health`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["http.js"]
