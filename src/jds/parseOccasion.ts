import { type HTMLElement, parse } from "node-html-parser";
import type {
  AccessoryGroup,
  Fuel,
  OccasionDetails,
  Spec,
  Transmission,
} from "./schemas";
import {
  cleanText,
  matchInteger,
  normalizeForSearch,
  parseDecimal,
  parseInteger,
} from "./text";
import { occasionUrl, toAbsoluteUrl } from "./urls";

const FUELS: Record<string, Fuel> = {
  benzine: "petrol",
  diesel: "diesel",
  elektrisch: "electric",
  electrisch: "electric",
};

const toFuel = (value: string | null): Fuel | null =>
  (value && FUELS[normalizeForSearch(value)]) || null;

/** "Handgeschakeld (5 versn.)" → manual, "Automaat" → automatic. */
const toTransmission = (value: string | null): Transmission | null => {
  const normalized = normalizeForSearch(value ?? "");
  if (normalized.startsWith("handgeschakeld")) return "manual";
  if (normalized.startsWith("automaat")) return "automatic";
  return null;
};

const toVatStatus = (value: string | null): OccasionDetails["vatStatus"] => {
  const normalized = normalizeForSearch(value ?? "");
  if (normalized === "marge") return "margin";
  if (normalized === "btw") return "vat";
  return null;
};

/** "geldig tot 23-03-2027" → "2027-03-23". */
const toIsoDate = (value: string | null): string | null => {
  const match = value?.match(/(\d{2})-(\d{2})-(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

/** `<li><span>Label</span> value</li>` */
const parseSpecRow = (row: HTMLElement): Spec => {
  const label = row.querySelector("span");
  return {
    label: cleanText(label?.text ?? ""),
    value: cleanText(
      row.childNodes
        .filter((node) => node !== label)
        .map((node) => node.text)
        .join(""),
    ),
  };
};

/**
 * Items come as "- Achterbank 3-persoons"; some are CSV-quoted
 * (`"Lichtmetalen velgen 17"""`) and the site pads every list with a bare "2".
 */
const cleanAccessory = (text: string): string | null => {
  let item = cleanText(text).replace(/^-\s*/, "");
  if (item.length > 1 && item.startsWith('"') && item.endsWith('"')) {
    item = item.slice(1, -1).replaceAll('""', '"');
  }
  return item && !/^\d+$/.test(item) ? item : null;
};

const parseAccessories = (carInfo: HTMLElement): AccessoryGroup[] => {
  const block = carInfo
    .querySelectorAll(".info-block")
    .find((b) => /accesoires/i.test(b.querySelector("h3")?.text ?? ""));

  return (block?.querySelectorAll("h4") ?? [])
    .map((heading) => ({
      category: cleanText(heading.text),
      items: (heading.nextElementSibling?.querySelectorAll("li") ?? [])
        .map((li) => cleanAccessory(li.text))
        .filter((item) => item !== null),
    }))
    .filter((group) => group.items.length > 0);
};

/** Returns null for unknown ids, which the site serves as an unfilled template. */
export const parseOccasionPage = (
  html: string,
  id: number,
): OccasionDetails | null => {
  const carInfo = parse(html).querySelector("#car-info");
  const title = cleanText(carInfo?.querySelector("#title h2")?.text ?? "");
  if (!carInfo || !title || title === "{TITLE}") return null;

  const specs = carInfo
    .querySelectorAll("ul.basis-informatie li")
    .map(parseSpecRow)
    .filter((spec) => spec.label !== "");

  const spec = (label: string): string | null =>
    specs.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value ||
    null;

  const transmission = spec("Transmissie");
  const power = spec("Vermogen");
  const apk = spec("APK");
  const priceHeading = carInfo
    .querySelectorAll(".info-block h3")
    .find((h3) => h3.text.includes("€"))?.text;
  const canonicalHref = carInfo
    .querySelector("#print-car")
    ?.getAttribute("href");

  return {
    id,
    title,
    url: canonicalHref ? toAbsoluteUrl(canonicalHref) : occasionUrl(id),
    priceEur: parseInteger(spec("Prijs")) ?? parseInteger(priceHeading),
    brand: spec("Merk"),
    model: spec("Model"),
    variant: spec("Type"),
    bodyType: spec("Carrosserie"),
    year: parseInteger(spec("Bouwjaar")),
    mileageKm: parseInteger(spec("KM stand")),
    fuel: toFuel(spec("Brandstof")),
    transmission: toTransmission(transmission),
    gears: matchInteger(transmission, /(\d+)\s*versn/i),
    doors: parseInteger(spec("Aantal deuren")),
    color: spec("Kleur"),
    upholstery: spec("Bekleding"),
    cylinders: parseInteger(spec("Aantal cilinders")),
    engineCapacityCc: parseInteger(spec("Cilinderinhoud")),
    powerKw: matchInteger(power, /(\d+)\s*kw/i),
    powerHp: matchInteger(power, /(\d+)\s*pk/i),
    fuelConsumption: {
      combined: parseDecimal(spec("Verbruik gemiddeld")),
      city: parseDecimal(spec("Verbruik stad")),
      highway: parseDecimal(spec("Verbruik snelweg")),
    },
    weightKg: parseInteger(spec("Gewicht")),
    apk: {
      validUntil: toIsoDate(apk),
      renewedOnDelivery: /aflevering/i.test(apk ?? ""),
    },
    vatStatus: toVatStatus(spec("BTW / Marge")),
    accessories: parseAccessories(carInfo),
    images: [
      ...new Set(
        carInfo
          .querySelectorAll(".voertuig-afbeeldingen a.lightbox")
          .map((a) => a.getAttribute("href"))
          .filter((href) => href !== undefined)
          .map(toAbsoluteUrl),
      ),
    ],
    specs,
  };
};
