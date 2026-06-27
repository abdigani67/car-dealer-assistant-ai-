import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidCar, type NormalizedCar } from "@/lib/csv";

// Server-side bulk insert. dealer_id is taken from the authenticated session,
// never from the client, and RLS enforces it again at the database layer.
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { rows?: NormalizedCar[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json(
      { error: "Too many rows in one import (max 2000)." },
      { status: 400 },
    );
  }

  const valid: NormalizedCar[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (isValidCar(row)) valid.push(row);
    else skipped += 1;
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { imported: 0, skipped, error: "No valid rows — make and model required." },
      { status: 422 },
    );
  }

  const payload = valid.map((c) => ({
    dealer_id: user.id,
    make: c.make,
    model: c.model,
    year: c.year,
    mileage: c.mileage,
    price: c.price,
    colour: c.colour,
    fuel_type: c.fuel_type,
    transmission: c.transmission,
    description: c.description,
    available: true,
  }));

  // Insert in chunks so one large file doesn't hit payload limits.
  const CHUNK = 200;
  let imported = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from("stock")
      .insert(slice, { count: "exact" });
    if (error) {
      return NextResponse.json(
        {
          imported,
          skipped,
          error: `Import stopped after ${imported} rows: ${error.message}`,
        },
        { status: 500 },
      );
    }
    imported += count ?? slice.length;
  }

  return NextResponse.json({ imported, skipped });
}
