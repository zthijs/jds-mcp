import { describe, expect, test } from "bun:test";
import { buildListingUrl, occasionUrl } from "./urls";

describe("buildListingUrl", () => {
  test("returns the plain listing without filters", () => {
    expect(buildListingUrl()).toBe("https://www.autocentrumjds.nl/occasions/");
  });

  test("maps filters to the site's query params and codes", () => {
    const url = new URL(
      buildListingUrl({
        brand: "mercedes-benz",
        fuel: "diesel",
        transmission: "automatic",
        minYear: 2015,
        maxYear: 2020,
        maxPrice: 15000,
      }),
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      "filter[merk]": "mercedes-benz",
      "filter[brandstof]": "D",
      "filter[transmissie]": "A",
      "filter[min_bouwjaar]": "2015",
      "filter[max_bouwjaar]": "2020",
      "filter[max_prijs]": "15000",
    });
  });
});

test("occasionUrl", () => {
  expect(occasionUrl(502)).toBe("https://www.autocentrumjds.nl/occasions/502/");
});
