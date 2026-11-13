import { describe, expect, test } from "bun:test";
import { fixture } from "../../test/mockSite";
import { parseOccasionPage } from "./parseOccasion";

const parseFixture = async (id: number) => {
  const occasion = parseOccasionPage(await fixture(`occasion-${id}.html`), id);
  if (!occasion) throw new Error(`fixture ${id} did not parse`);
  return occasion;
};

describe("parseOccasionPage", () => {
  test("parses a fully specified occasion", async () => {
    const { images, specs, ...occasion } = await parseFixture(502);

    expect(occasion).toEqual({
      id: 502,
      title: "Audi A1 Sportback S Line Binnen en Buiten ! 1.2 TFSI Admired",
      url: "https://www.autocentrumjds.nl/occasions/502/audi-a1-sportback-s-line-binnen-en-buiten--12-tfsi-admired.html",
      priceEur: 9950,
      brand: "Audi",
      model: "A1",
      variant: "Sportback S Line Binnen en Buiten ! 1.2 TFSI Admired",
      bodyType: "Hatchback (5 drs)",
      year: 2014,
      mileageKm: 125874,
      fuel: "petrol",
      transmission: "manual",
      gears: 5,
      doors: 5,
      color: "zwart",
      upholstery: "Leder",
      cylinders: 4,
      engineCapacityCc: 1197,
      powerKw: 63,
      powerHp: 86,
      fuelConsumption: { combined: 5.1, city: 6.2, highway: 4.4 },
      weightKg: 1040,
      apk: { validUntil: "2027-03-23", renewedOnDelivery: false },
      vatStatus: "margin",
      accessories: [
        { category: "Comfort & Interieur", items: ["Achterbank 3-persoons"] },
        { category: "Exterieur", items: ['Lichtmetalen velgen 17"'] },
        { category: "Veiligheid", items: ["Airbag(s) hoofd achter"] },
        { category: "Overig", items: ["Autotelefoonvoorbereiding"] },
      ],
    });
    expect(images).toHaveLength(35);
    expect(images[0]).toBe(
      "https://www.autocentrumjds.nl/images/scale/audi_a1_57198103_001.jpg?path=upload/occasions/&width=1000&height=566&type=normal",
    );
    expect(specs).toContainEqual({ label: "KM stand", value: "125874" });
  });

  test("handles an unlisted fuel, automatic transmission and APK on delivery", async () => {
    const occasion = await parseFixture(281);
    expect(occasion.fuel).toBeNull();
    expect(occasion.specs).toContainEqual({ label: "Brandstof", value: "" });
    expect(occasion.transmission).toBe("automatic");
    expect(occasion.gears).toBeNull();
    expect(occasion.apk).toEqual({ validUntil: null, renewedOnDelivery: true });
  });

  test("returns null for fields a scooter doesn't have", async () => {
    const occasion = await parseFixture(333);
    expect(occasion.model).toBeNull();
    expect(occasion.doors).toBeNull();
    expect(occasion.upholstery).toBeNull();
    expect(occasion.fuelConsumption).toEqual({
      combined: null,
      city: null,
      highway: null,
    });
    expect(occasion.apk).toEqual({
      validUntil: null,
      renewedOnDelivery: false,
    });
    expect(occasion.powerKw).toBe(1);
    expect(occasion.powerHp).toBe(2);
  });

  test("returns null for an unknown id (the site serves an unfilled template)", async () => {
    expect(
      parseOccasionPage(await fixture("occasion-not-found.html"), 99999),
    ).toBeNull();
  });
});
