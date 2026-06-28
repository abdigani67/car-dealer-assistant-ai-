"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants";
import type { Stock } from "@/lib/types";

type FormState = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  price: string;
  colour: string;
  fuel_type: string;
  transmission: string;
  description: string;
  listing_url: string;
};

const empty: FormState = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  price: "",
  colour: "",
  fuel_type: "",
  transmission: "",
  description: "",
  listing_url: "",
};

function toForm(car: Stock): FormState {
  return {
    make: car.make ?? "",
    model: car.model ?? "",
    year: car.year?.toString() ?? "",
    mileage: car.mileage?.toString() ?? "",
    price: car.price?.toString() ?? "",
    colour: car.colour ?? "",
    fuel_type: car.fuel_type ?? "",
    transmission: car.transmission ?? "",
    description: car.description ?? "",
    listing_url: car.listing_url ?? "",
  };
}

export function CarModal({
  open,
  onClose,
  car,
  dealerId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  car: Stock | null;
  dealerId: string;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(car ? toForm(car) : empty);
  }, [car, open]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.make.trim() || !form.model.trim()) {
      toast.error("Make and model are required.");
      return;
    }
    setSaving(true);

    const payload = {
      dealer_id: dealerId,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? parseInt(form.year, 10) : null,
      mileage: form.mileage ? parseInt(form.mileage.replace(/\D/g, ""), 10) : null,
      price: form.price ? parseInt(form.price.replace(/\D/g, ""), 10) : null,
      colour: form.colour.trim() || null,
      fuel_type: form.fuel_type || null,
      transmission: form.transmission || null,
      description: form.description.trim() || null,
      listing_url: form.listing_url.trim() || null,
    };

    const res = car
      ? await supabase.from("stock").update(payload).eq("id", car.id)
      : await supabase.from("stock").insert({ ...payload, available: true });

    setSaving(false);
    if (res.error) {
      toast.error(`Couldn't save: ${res.error.message}`);
      return;
    }
    toast.success(car ? "Car updated." : "Car added to stock.");
    onSaved();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={car ? "Edit car" : "Add a car"}
      description="Details shown to your AI assistant and in matching suggestions."
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-1">
          <Label htmlFor="make">Make *</Label>
          <Input id="make" value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="BMW" />
        </div>
        <div className="col-span-1">
          <Label htmlFor="model">Model *</Label>
          <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="3 Series" />
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input id="year" inputMode="numeric" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2019" />
        </div>
        <div>
          <Label htmlFor="mileage">Mileage</Label>
          <Input id="mileage" inputMode="numeric" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="42000" />
        </div>
        <div>
          <Label htmlFor="price">Price (£)</Label>
          <Input id="price" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="14995" />
        </div>
        <div>
          <Label htmlFor="colour">Colour</Label>
          <Input id="colour" value={form.colour} onChange={(e) => set("colour", e.target.value)} placeholder="Black" />
        </div>
        <div>
          <Label htmlFor="fuel">Fuel</Label>
          <Select id="fuel" value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>
            <option value="">Select…</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="transmission">Transmission</Label>
          <Select id="transmission" value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
            <option value="">Select…</option>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Full service history, one owner, MOT until…"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="listing_url">Autotrader / Listing URL (optional)</Label>
          <Input
            id="listing_url"
            type="url"
            value={form.listing_url}
            onChange={(e) => set("listing_url", e.target.value)}
            placeholder="https://www.autotrader.co.uk/..."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving}>
          {car ? "Save changes" : "Add car"}
        </Button>
      </div>
    </Modal>
  );
}
