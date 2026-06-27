"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, MessageCircle, CalendarClock, Bot, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { AI_TONES, type AiToneKey } from "@/lib/constants";

interface SettingsForm {
  dealer_name: string;
  whatsapp_number: string;
  booking_link: string;
  opening_hours: string;
  tone: AiToneKey | "custom";
  custom_instructions: string;
}

// Infer which tone preset the saved instructions correspond to.
function inferTone(instructions: string | null): {
  tone: AiToneKey | "custom";
  custom: string;
} {
  if (!instructions) return { tone: "professional", custom: "" };
  const match = AI_TONES.find((t) => t.instructions === instructions);
  if (match) return { tone: match.key, custom: "" };
  return { tone: "custom", custom: instructions };
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Never select whatsapp_token here — it stays server-only.
      const { data, error } = await supabase
        .from("dealers")
        .select(
          "dealer_name, whatsapp_number, booking_link, ai_instructions, opening_hours",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Couldn't load settings.");
        return;
      }

      const { tone, custom } = inferTone(data?.ai_instructions ?? null);
      setForm({
        dealer_name: data?.dealer_name ?? "",
        whatsapp_number: data?.whatsapp_number ?? "",
        booking_link: data?.booking_link ?? "",
        opening_hours: data?.opening_hours ?? "",
        tone,
        custom_instructions: custom,
      });
    })();
  }, [supabase]);

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function save() {
    if (!form) return;
    setSaving(true);

    // Custom instructions override the tone preset when present.
    const customTrimmed = form.custom_instructions.trim();
    const ai_instructions =
      customTrimmed.length > 0
        ? customTrimmed
        : (AI_TONES.find((t) => t.key === form.tone)?.instructions ??
          AI_TONES[0].instructions);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("dealers")
      .update({
        dealer_name: form.dealer_name.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        booking_link: form.booking_link.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
        ai_instructions,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error(`Couldn't save: ${error.message}`);
      return;
    }
    toast.success("Settings saved.");
  }

  const loading = form === null;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure your business details and AI assistant."
      />

      {loading ? (
        <div className="grid max-w-3xl gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid max-w-3xl gap-4">
          {/* Business */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Building2 className="h-4 w-4 text-brand-300" /> Business details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Business name</Label>
                <Input
                  id="name"
                  value={form.dealer_name}
                  onChange={(e) => set("dealer_name", e.target.value)}
                  placeholder="Premier Motors Ltd"
                />
              </div>
              <div>
                <Label htmlFor="wa">WhatsApp number</Label>
                <div className="relative">
                  <MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    id="wa"
                    value={form.whatsapp_number}
                    onChange={(e) => set("whatsapp_number", e.target.value)}
                    placeholder="+44 7700 900123"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="booking">Booking link</Label>
                <Input
                  id="booking"
                  value={form.booking_link}
                  onChange={(e) => set("booking_link", e.target.value)}
                  placeholder="https://calendly.com/your-dealership"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="hours">Opening hours</Label>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    id="hours"
                    value={form.opening_hours}
                    onChange={(e) => set("opening_hours", e.target.value)}
                    placeholder="Mon–Sat 9am–6pm, Sun 10am–4pm"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* AI assistant */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Bot className="h-4 w-4 text-accent-300" /> AI assistant
            </h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select
                  id="tone"
                  value={form.tone}
                  onChange={(e) =>
                    set("tone", e.target.value as SettingsForm["tone"])
                  }
                >
                  {AI_TONES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </Select>
                <p className="mt-1.5 text-xs text-white/40">
                  {form.tone !== "custom" &&
                    AI_TONES.find((t) => t.key === form.tone)?.instructions}
                </p>
              </div>

              <div>
                <Label htmlFor="custom">Custom AI instructions</Label>
                <Textarea
                  id="custom"
                  rows={5}
                  value={form.custom_instructions}
                  onChange={(e) => set("custom_instructions", e.target.value)}
                  placeholder="Leave blank to use the tone preset above. Anything you type here overrides it."
                />
                <p className="mt-1.5 text-xs text-white/40">
                  If filled in, this overrides the tone preset entirely.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              {!saving && <Save className="h-4 w-4" />} Save changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
