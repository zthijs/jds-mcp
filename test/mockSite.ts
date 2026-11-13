import { type Mock, spyOn } from "bun:test";
import { clearHtmlCache } from "@/jds/http";

const FIXTURES = `${import.meta.dir}/fixtures`;

export const fixture = (name: string): Promise<string> =>
  Bun.file(`${FIXTURES}/${name}`).text();

/** Fixture served for a site URL, mimicking how autocentrumjds.nl responds. */
const fixtureFor = (url: URL): string => {
  const occasionId = url.pathname.match(/^\/occasions\/(\d+)\//)?.[1];
  if (occasionId) {
    return ["502", "281", "333"].includes(occasionId)
      ? `occasion-${occasionId}.html`
      : "occasion-not-found.html";
  }
  return url.searchParams.get("filter[merk]") === "mazda"
    ? "listing-empty.html"
    : "listing.html";
};

/** Replaces `fetch` with fixture responses until `mockRestore()` is called. */
export const mockSite = (): Mock<typeof fetch> => {
  clearHtmlCache();
  // Bun's `fetch` type also carries `preconnect`, so keep the real one.
  const { preconnect } = fetch;
  const fakeFetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(String(input), init);
    const url = new URL(request.url);
    return new Response(await fixture(fixtureFor(url)), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
  return spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(fakeFetch, { preconnect }),
  );
};
