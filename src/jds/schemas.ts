import { z } from "zod";

export const fuelSchema = z
  .enum(["petrol", "diesel", "electric"])
  .describe("Fuel type");
export type Fuel = z.infer<typeof fuelSchema>;

export const transmissionSchema = z
  .enum(["manual", "automatic"])
  .describe("Transmission type");
export type Transmission = z.infer<typeof transmissionSchema>;

/** The site's `filter[brandstof]` / `filter[transmissie]` codes. */
export const FUEL_CODES = {
  petrol: "B",
  diesel: "D",
  electric: "E",
} as const satisfies Record<Fuel, string>;

export const TRANSMISSION_CODES = {
  manual: "H",
  automatic: "A",
} as const satisfies Record<Transmission, string>;

const yearSchema = z.number().int().describe("Year of manufacture (bouwjaar)");
const mileageSchema = z.number().int().describe("Odometer reading in km");
const priceSchema = z.number().int().describe("Asking price in euros");

export const occasionSummarySchema = z.object({
  id: z
    .number()
    .int()
    .describe("Occasion id; pass it to get_occasion or compare_occasions"),
  title: z.string().describe("Listing title as shown on the site"),
  brand: z
    .string()
    .nullable()
    .describe("Brand name, e.g. 'Volkswagen'; null if not recognised"),
  year: yearSchema.nullable(),
  mileageKm: mileageSchema.nullable(),
  priceEur: priceSchema.nullable(),
  url: z.url().describe("Detail page on autocentrumjds.nl"),
  imageUrl: z.url().nullable().describe("Main photo"),
});
export type OccasionSummary = z.infer<typeof occasionSummarySchema>;

export const specSchema = z.object({
  label: z.string().describe("Dutch label as shown on the site"),
  value: z.string(),
});
export type Spec = z.infer<typeof specSchema>;

export const accessoryGroupSchema = z.object({
  category: z.string().describe("e.g. 'Comfort & Interieur', 'Veiligheid'"),
  items: z.array(z.string()),
});
export type AccessoryGroup = z.infer<typeof accessoryGroupSchema>;

const litresPer100KmSchema = z.number().nullable();

export const occasionDetailsSchema = z.object({
  id: occasionSummarySchema.shape.id,
  title: occasionSummarySchema.shape.title,
  url: occasionSummarySchema.shape.url,
  priceEur: priceSchema.nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  variant: z
    .string()
    .nullable()
    .describe("Type/trim line, e.g. '1.2 TFSI Admired'"),
  bodyType: z
    .string()
    .nullable()
    .describe("Body style in Dutch, e.g. 'Hatchback (5 drs)', 'Stationwagon'"),
  year: yearSchema.nullable(),
  mileageKm: mileageSchema.nullable(),
  fuel: fuelSchema
    .nullable()
    .describe(
      "null when the site lists no or an unknown fuel (e.g. CNG/LPG); see specs",
    ),
  transmission: transmissionSchema.nullable(),
  gears: z.number().int().nullable(),
  doors: z.number().int().nullable(),
  color: z.string().nullable().describe("Colour in Dutch, e.g. 'zwart'"),
  upholstery: z
    .string()
    .nullable()
    .describe("Upholstery in Dutch, e.g. 'Stof', 'Leder'"),
  cylinders: z.number().int().nullable(),
  engineCapacityCc: z.number().int().nullable(),
  powerKw: z.number().int().nullable(),
  powerHp: z.number().int().nullable(),
  fuelConsumption: z
    .object({
      combined: litresPer100KmSchema,
      city: litresPer100KmSchema,
      highway: litresPer100KmSchema,
    })
    .describe("Litres per 100 km"),
  weightKg: z.number().int().nullable(),
  apk: z
    .object({
      validUntil: z.iso
        .date()
        .nullable()
        .describe("Expiry of the current APK (Dutch MOT)"),
      renewedOnDelivery: z
        .boolean()
        .describe("The dealer performs a fresh APK on delivery"),
    })
    .describe("APK (Dutch periodic vehicle inspection)"),
  vatStatus: z
    .enum(["margin", "vat"])
    .nullable()
    .describe(
      "'margin': margin scheme, VAT not deductible; 'vat': VAT deductible for businesses",
    ),
  accessories: z.array(accessoryGroupSchema),
  images: z.array(z.url()).describe("Full-size photos"),
  specs: z
    .array(specSchema)
    .describe("Every spec row exactly as listed on the site, in Dutch"),
});
export type OccasionDetails = z.infer<typeof occasionDetailsSchema>;
