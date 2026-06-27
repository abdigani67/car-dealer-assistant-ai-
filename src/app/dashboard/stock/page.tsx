"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Upload, Pencil, Trash2, Car, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CarModal } from "@/components/stock/CarModal";
import { CsvUpload } from "@/components/stock/CsvUpload";
import { formatMileage, formatPrice } from "@/lib/utils";
import type { Stock } from "@/lib/types";

export default function StockPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stock, setStock] = useState<Stock[] | null>(null);
  const [dealerId, setDealerId] = useState<string>("");

  const [query, setQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Stock | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Couldn't load stock.");
      setStock([]);
      return;
    }
    setStock((data as Stock[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setDealerId(data.user?.id ?? ""));
    load();
  }, [supabase, load]);

  async function toggleAvailable(car: Stock, next: boolean) {
    setStock((prev) =>
      prev ? prev.map((c) => (c.id === car.id ? { ...c, available: next } : c)) : prev,
    );
    const { error } = await supabase
      .from("stock")
      .update({ available: next })
      .eq("id", car.id);
    if (error) {
      setStock((prev) =>
        prev
          ? prev.map((c) => (c.id === car.id ? { ...c, available: !next } : c))
          : prev,
      );
      toast.error("Couldn't update availability.");
    }
  }

  async function archive(car: Stock) {
    if (!confirm(`Remove ${[car.make, car.model].filter(Boolean).join(" ")} from stock?`))
      return;
    setStock((prev) => (prev ? prev.filter((c) => c.id !== car.id) : prev));
    const { error } = await supabase
      .from("stock")
      .update({ archived_at: new Date().toISOString(), available: false })
      .eq("id", car.id);
    if (error) {
      toast.error("Couldn't remove car.");
      load();
      return;
    }
    toast.success("Car removed from stock.");
  }

  const makes = useMemo(() => {
    const set = new Set<string>();
    (stock ?? []).forEach((c) => c.make && set.add(c.make));
    return Array.from(set).sort();
  }, [stock]);

  const filtered = useMemo(() => {
    if (!stock) return [];
    const q = query.trim().toLowerCase();
    return stock.filter((c) => {
      if (availableOnly && !c.available) return false;
      if (makeFilter && c.make !== makeFilter) return false;
      if (fuelFilter && c.fuel_type !== fuelFilter) return false;
      if (q) {
        const hay = [c.make, c.model, c.colour, c.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stock, query, makeFilter, fuelFilter, availableOnly]);

  const fuels = useMemo(() => {
    const set = new Set<string>();
    (stock ?? []).forEach((c) => c.fuel_type && set.add(c.fuel_type));
    return Array.from(set).sort();
  }, [stock]);

  const loading = stock === null;

  return (
    <>
      <PageHeader
        title="Stock Manager"
        subtitle={
          loading
            ? "Loading your inventory…"
            : `${filtered.length} of ${stock!.length} cars shown`
        }
        action={
          <>
            <Button variant="secondary" onClick={() => setCsvOpen(true)}>
              <Upload className="h-4 w-4" /> CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add car
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search make, model, colour…"
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)}>
              <option value="">All makes</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)}>
              <option value="">All fuels</option>
              {fuels.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 lg:pl-1">
            <Toggle
              checked={availableOnly}
              onChange={setAvailableOnly}
              label="Available only"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="m-4 border-0"
            icon={Car}
            title={stock!.length === 0 ? "No cars in stock yet" : "No cars match"}
            description={
              stock!.length === 0
                ? "Add your first car or import your inventory from a CSV."
                : "Try clearing a filter or search term."
            }
            action={
              stock!.length === 0 ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setCsvOpen(true)}>
                    <Upload className="h-4 w-4" /> Import CSV
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add car
                  </Button>
                </div>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-white/35">
                  <th className="px-4 py-3 font-medium">Make</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Mileage</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Colour</th>
                  <th className="px-4 py-3 font-medium">Fuel</th>
                  <th className="px-4 py-3 font-medium">Trans.</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-white/[0.04] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-white">{c.make}</td>
                    <td className="px-4 py-3 text-white/80">{c.model}</td>
                    <td className="px-4 py-3 text-white/55">{c.year ?? "—"}</td>
                    <td className="px-4 py-3 text-white/55">
                      {formatMileage(c.mileage)}
                    </td>
                    <td className="px-4 py-3 font-medium text-accent-300">
                      {formatPrice(c.price)}
                    </td>
                    <td className="px-4 py-3 text-white/55">{c.colour ?? "—"}</td>
                    <td className="px-4 py-3 text-white/55">{c.fuel_type ?? "—"}</td>
                    <td className="px-4 py-3 text-white/55">
                      {c.transmission ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Toggle
                        checked={c.available}
                        onChange={(v) => toggleAvailable(c, v)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(c);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => archive(c)}
                          className="rounded-lg p-2 text-white/50 transition hover:bg-hot/15 hover:text-hot focus:outline-none focus-visible:ring-2 focus-visible:ring-hot"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {dealerId && (
        <CarModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          car={editing}
          dealerId={dealerId}
          onSaved={load}
        />
      )}
      <CsvUpload
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImported={load}
      />
    </>
  );
}
