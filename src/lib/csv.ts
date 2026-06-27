import { CSV_COLUMN_ALIASES } from "./constants";

export interface NormalizedCar {
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  price: number | null;
  colour: string | null;
  fuel_type: string | null;
  transmission: string | null;
  description: string | null;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const digits = String(value).replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const n = Math.round(parseFloat(digits));
  return Number.isFinite(n) ? n : null;
}

function clean(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

// Map one raw CSV record (header → value) onto canonical stock columns,
// tolerating common header-name variations.
export function normalizeRow(raw: Record<string, unknown>): NormalizedCar {
  const out: Record<string, unknown> = {};
  for (const [header, value] of Object.entries(raw)) {
    const canonical = CSV_COLUMN_ALIASES[header.trim().toLowerCase()];
    if (!canonical) continue;
    if (out[canonical] == null || out[canonical] === "") {
      out[canonical] = value;
    }
  }
  return {
    make: clean(out.make),
    model: clean(out.model),
    year: toNumber(out.year),
    mileage: toNumber(out.mileage),
    price: toNumber(out.price),
    colour: clean(out.colour),
    fuel_type: clean(out.fuel_type),
    transmission: clean(out.transmission),
    description: clean(out.description),
  };
}

export function normalizeRows(rows: Record<string, unknown>[]): NormalizedCar[] {
  return rows.map(normalizeRow);
}

// A row is importable if it has at least a make and a model.
export function isValidCar(car: NormalizedCar): boolean {
  return !!car.make && !!car.model;
}
