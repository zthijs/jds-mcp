import { describe, expect, test } from "bun:test";
import { fixture } from "../../test/mockSite";
import { parseListingPage } from "./parseListing";

describe("parseListingPage", async () => {
  const page = parseListingPage(await fixture("listing.html"));

  test("parses every grid item but not the 'Nieuwste' sidebar", () => {
    expect(page.occasions).toHaveLength(76);
    expect(new Set(page.occasions.map((o) => o.id)).size).toBe(76);
  });

  test("parses an occasion summary", () => {
    expect(page.occasions[0]).toEqual({
      id: 502,
      title: "Audi A1 Sportback S Line Binnen en Buiten ! 1.2 TFSI Admired",
      brand: "Audi",
      year: 2014,
      mileageKm: 125874,
      priceEur: 9950,
      url: "https://www.autocentrumjds.nl/occasions/502/audi-a1-sportback-s-line-binnen-en-buiten--12-tfsi-admired.html",
      imageUrl:
        "https://www.autocentrumjds.nl/images/scale/audi_a1_57198103_001.jpg?path=upload/occasions/&width=600&height=400&type=scalecropped&r=230&g=230&b=230",
    });
  });

  test("recognises brands from titles, including multi-word and uppercase ones", () => {
    const brandOf = (id: number) =>
      page.occasions.find((o) => o.id === id)?.brand;
    expect(brandOf(226)).toBe("Mercedes-Benz");
    expect(brandOf(246)).toBe("MINI");
    expect(brandOf(481)).toBe("SEAT");
    expect(page.occasions.every((o) => o.brand !== null)).toBe(true);
  });

  test("parses prices below and above a thousand", () => {
    const priceOf = (id: number) =>
      page.occasions.find((o) => o.id === id)?.priceEur;
    expect(priceOf(352)).toBe(999);
    expect(priceOf(226)).toBe(23950);
  });

  test("parses the search form options", () => {
    expect(page.form.brands).toHaveLength(30);
    expect(page.form.brands).toContainEqual({
      value: "mercedes-benz",
      label: "Mercedes-Benz",
    });
    expect(page.form.fuels.map((o) => o.value)).toEqual(["B", "D", "E"]);
    expect(page.form.transmissions.map((o) => o.value)).toEqual(["H", "A"]);
    expect(page.form.years.at(0)).toBe(2000);
    expect(page.form.years.at(-1)).toBe(2022);
    expect(page.form.priceSteps).toEqual([
      999, 11950, 13319, 14688, 16057, 17426, 18795, 20164, 21533,
    ]);
  });

  test("returns no occasions for an empty result page", async () => {
    const empty = parseListingPage(await fixture("listing-empty.html"));
    expect(empty.occasions).toEqual([]);
    expect(empty.form.brands).toHaveLength(30);
  });
});
