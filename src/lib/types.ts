// Database row types for Runova Auto.
// NOTE: whatsapp_token is intentionally omitted from DealerClient — it must
// never be selected into client-side code. Use DealerServer only on the server.

export type LeadStage =
  | "new"
  | "contacted"
  | "viewing_booked"
  | "deal_closed";

export type LeadTemperature = "hot" | "warm" | "cold";

export type Channel = "whatsapp" | "web" | "email";

export type SenderType = "user" | "ai" | "staff";

export interface Dealer {
  id: string;
  dealer_name: string | null;
  whatsapp_number: string | null;
  booking_link: string | null;
  ai_instructions: string | null;
  opening_hours: string | null;
  created_at: string;
}

// Server-only — includes the secret token. Never import into a client component.
export interface DealerServer extends Dealer {
  whatsapp_token: string | null;
}

export interface Stock {
  id: string;
  dealer_id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  price: number | null;
  colour: string | null;
  fuel_type: string | null;
  transmission: string | null;
  description: string | null;
  available: boolean;
  archived_at: string | null;
  listing_url: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  dealer_id: string;
  contact: string | null;
  channel: Channel | null;
  budget: string | null;
  part_ex: boolean | null;
  timeline: string | null;
  lead_stage: LeadStage | null;
  lead_temperature: LeadTemperature | null;
  last_message: string | null;
  ai_active: boolean;
  interested_stock_id: string | null;
  created_at: string;
  last_contact: string | null;
}

export interface Conversation {
  id: string;
  lead_id: string;
  dealer_id: string;
  contact: string | null;
  sender_type: SenderType;
  message_text: string | null;
  timestamp: string;
}

export const LEAD_STAGES: { key: LeadStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing_booked", label: "Viewing Booked" },
  { key: "deal_closed", label: "Deal Closed" },
];
