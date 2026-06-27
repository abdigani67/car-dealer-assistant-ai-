import type { Channel, LeadTemperature } from "./types";

// AI tone presets — mapped to ready-made instruction blocks. The Settings page
// writes the chosen preset into dealers.ai_instructions unless the dealer has
// typed custom instructions (which override).
export const AI_TONES = [
  {
    key: "professional",
    label: "Professional",
    instructions:
      "You are a professional, courteous sales assistant for a UK used-car dealership. Use clear, polished British English. Be concise and helpful, confirm details precisely, and always offer to book a viewing or arrange a callback. Never invent stock you don't have.",
  },
  {
    key: "friendly",
    label: "Friendly",
    instructions:
      "You are a warm, friendly sales assistant for a UK used-car dealership. Use approachable British English, a little personality, and emojis sparingly. Make the customer feel looked after, answer questions about the cars, and gently steer towards booking a viewing.",
  },
  {
    key: "no_nonsense",
    label: "No-nonsense",
    instructions:
      "You are a direct, no-nonsense sales assistant for a UK used-car dealership. Keep replies short and to the point in plain British English. Give the facts — price, mileage, availability — and push for the next step: a viewing or a call. No fluff.",
  },
] as const;

export type AiToneKey = (typeof AI_TONES)[number]["key"];

// Channel badge styling.
export const CHANNEL_STYLES: Record<
  Channel,
  { label: string; className: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    className: "bg-[#25D366]/15 text-[#39E27C] ring-1 ring-[#25D366]/30",
  },
  web: {
    label: "Web",
    className: "bg-cold/15 text-cold ring-1 ring-cold/30",
  },
  email: {
    label: "Email",
    className: "bg-white/10 text-white/70 ring-1 ring-white/15",
  },
};

// Temperature badge styling.
export const TEMPERATURE_STYLES: Record<
  LeadTemperature,
  { label: string; className: string; dot: string }
> = {
  hot: {
    label: "Hot",
    className: "bg-hot/15 text-hot ring-1 ring-hot/30",
    dot: "bg-hot",
  },
  warm: {
    label: "Warm",
    className: "bg-warm/15 text-warm ring-1 ring-warm/30",
    dot: "bg-warm",
  },
  cold: {
    label: "Cold",
    className: "bg-cold/15 text-cold ring-1 ring-cold/30",
    dot: "bg-cold",
  },
};

// Common CSV header variations → canonical stock column.
export const CSV_COLUMN_ALIASES: Record<string, string> = {
  make: "make",
  brand: "make",
  manufacturer: "make",
  marque: "make",
  model: "model",
  variant: "model",
  trim: "model",
  year: "year",
  reg: "year",
  "reg year": "year",
  "registration year": "year",
  "year of manufacture": "year",
  mileage: "mileage",
  miles: "mileage",
  odometer: "mileage",
  price: "price",
  "asking price": "price",
  "sale price": "price",
  "sales price": "price",
  cost: "price",
  colour: "colour",
  color: "colour",
  paint: "colour",
  fuel: "fuel_type",
  "fuel type": "fuel_type",
  fueltype: "fuel_type",
  transmission: "transmission",
  gearbox: "transmission",
  gears: "transmission",
  description: "description",
  notes: "description",
  details: "description",
  spec: "description",
};

export const FUEL_TYPES = [
  "Petrol",
  "Diesel",
  "Hybrid",
  "Electric",
  "Plug-in Hybrid",
  "LPG",
];

export const TRANSMISSIONS = ["Manual", "Automatic", "Semi-Automatic"];
