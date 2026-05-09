"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-sm h-64 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center">
      <span className="text-gray-500 text-sm">Loading camera…</span>
    </div>
  ),
});

interface ScanEntry {
  id: string;
  serial: string;
  scannedAt: string;
}

const STORAGE_KEY = "qr_serials";

function loadSerials(): ScanEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSerials(list: ScanEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Home() {
  const [serials, setSerials] = useState<ScanEntry[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSerials(loadSerials());
  }, []);

  const handleScan = useCallback(
    (text: string) => {
      if (pending || justSubmitted) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setPending(trimmed);
    },
    [pending, justSubmitted]
  );

  const handleSubmit = () => {
    if (!pending) return;
    const entry: ScanEntry = {
      id: crypto.randomUUID(),
      serial: pending,
      scannedAt: new Date().toISOString(),
    };
    const updated = [entry, ...serials];
    setSerials(updated);
    saveSerials(updated);
    setPending(null);
    setJustSubmitted(true);
    setTimeout(() => {
      setJustSubmitted(false);
      setScannerKey((k) => k + 1);
    }, 800);
  };

  const handleDiscard = () => {
    setPending(null);
    setScannerKey((k) => k + 1);
  };

  const handleDelete = (id: string) => {
    const updated = serials.filter((s) => s.id !== id);
    setSerials(updated);
    saveSerials(updated);
  };

  const handleExport = () => {
    const csv = [
      "Serial Number,Scanned At",
      ...serials.map(
        (s) => `"${s.serial}","${new Date(s.scannedAt).toLocaleString()}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `serials-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearSession = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setSerials([]);
    saveSerials([]);
    setConfirmClear(false);
    setPending(null);
    setScannerKey((k) => k + 1);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 gap-8">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-2xl font-bold tracking-tight">QR Serial Scanner</h1>
        <p className="text-gray-400 text-sm">
          Point camera at a QR code to capture the serial number
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        {pending ? (
          <div className="w-full flex flex-col gap-4">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex flex-col gap-1">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                QR Detected
              </p>
              <p className="text-lg font-mono font-bold break-all text-white">
                {pending}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all py-3 font-semibold text-black text-base"
            >
              Submit &amp; Scan Next
            </button>
            <button
              onClick={handleDiscard}
              className="w-full rounded-xl border border-white/10 hover:bg-white/5 active:scale-95 transition-all py-2.5 text-sm text-gray-400"
            >
              Discard
            </button>
          </div>
        ) : justSubmitted ? (
          <div className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex items-center justify-center gap-2">
            <span className="text-emerald-400 text-lg">✓</span>
            <p className="text-emerald-400 font-semibold">Saved! Ready to scan…</p>
          </div>
        ) : (
          <QRScanner key={scannerKey} onScan={handleScan} />
        )}
      </div>

      {serials.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-300">
              Scanned Serials ({serials.length})
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={handleClearSession}
                className={`text-xs transition-colors font-medium ${
                  confirmClear
                    ? "text-red-400 animate-pulse"
                    : "text-gray-500 hover:text-red-400"
                }`}
              >
                {confirmClear ? "Tap again to confirm" : "Clear session"}
              </button>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {serials.map((entry, i) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/8 px-4 py-3 gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-500">#{serials.length - i}</span>
                  <span className="font-mono text-sm text-white break-all">
                    {entry.serial}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.scannedAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete"
                  className="shrink-0 text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
