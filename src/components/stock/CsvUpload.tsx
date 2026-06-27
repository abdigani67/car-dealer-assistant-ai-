"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { normalizeRows, isValidCar, type NormalizedCar } from "@/lib/csv";
import { formatMileage, formatPrice } from "@/lib/utils";

export function CsvUpload({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<NormalizedCar[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  function reset() {
    setRows(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const normalized = normalizeRows(result.data);
        setRows(normalized);
        setParsing(false);
        if (normalized.length === 0) {
          toast.error("That file looked empty.");
        }
      },
      error: () => {
        setParsing(false);
        toast.error("Couldn't read that CSV.");
      },
    });
  }

  async function confirmImport() {
    if (!rows) return;
    const valid = rows.filter(isValidCar);
    if (valid.length === 0) {
      toast.error("No valid rows — each car needs at least a make and model.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/stock/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: valid }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Import failed.");
        return;
      }
      toast.success(
        `${data.imported} car${data.imported === 1 ? "" : "s"} imported successfully` +
          (data.skipped ? ` · ${data.skipped} skipped` : ""),
      );
      onImported();
      reset();
      onClose();
    } catch {
      toast.error("Import failed — please try again.");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows?.filter(isValidCar).length ?? 0;
  const invalidCount = (rows?.length ?? 0) - validCount;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import stock from CSV"
      description="We auto-map common column names like Brand, Asking Price, Gearbox."
      className="max-w-2xl"
    >
      {!rows ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center transition hover:border-brand/50 hover:bg-brand/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
            <UploadCloud className="h-6 w-6 text-brand-300" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">
              {parsing ? "Reading file…" : "Choose a CSV file"}
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              Make, Model, Year, Mileage, Price, Colour, Fuel, Transmission
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </button>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-white/60">
              <FileSpreadsheet className="h-4 w-4 text-accent-300" />
              {fileName}
            </span>
            <span className="text-white/45">
              {validCount} ready
              {invalidCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-warm">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {invalidCount} skipped
                </span>
              )}
            </span>
          </div>

          <div className="max-h-72 overflow-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="sticky top-0 bg-ink-850">
                <tr className="text-left text-white/40">
                  {["Make", "Model", "Year", "Mileage", "Price", "Colour", "Fuel"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => {
                  const ok = isValidCar(r);
                  return (
                    <tr
                      key={i}
                      className={`border-t border-white/[0.04] ${ok ? "" : "opacity-40"}`}
                    >
                      <td className="px-3 py-1.5 text-white/80">{r.make ?? "—"}</td>
                      <td className="px-3 py-1.5 text-white/80">{r.model ?? "—"}</td>
                      <td className="px-3 py-1.5 text-white/55">{r.year ?? "—"}</td>
                      <td className="px-3 py-1.5 text-white/55">
                        {r.mileage != null ? formatMileage(r.mileage) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-white/55">
                        {r.price != null ? formatPrice(r.price) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-white/55">{r.colour ?? "—"}</td>
                      <td className="px-3 py-1.5 text-white/55">
                        {r.fuel_type ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 100 && (
            <p className="mt-2 text-xs text-white/35">
              Showing first 100 of {rows.length} rows.
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              Choose another file
            </Button>
            <Button
              onClick={confirmImport}
              loading={importing}
              disabled={validCount === 0}
            >
              Import {validCount} car{validCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
