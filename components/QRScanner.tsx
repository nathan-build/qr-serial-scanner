"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (text: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = "qr-reader";

  useEffect(() => {
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          onScan(text);
        },
        undefined
      )
      .then(() => setActive(true))
      .catch((err) => {
        setError(
          typeof err === "string"
            ? err
            : "Camera access denied. Please allow camera permission."
        );
      });

    return () => {
      if (scanner.isScanning) scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div
        id={divId}
        className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10"
      />
      {!active && !error && (
        <p className="text-sm text-gray-400 animate-pulse">Starting camera…</p>
      )}
      {error && (
        <p className="text-sm text-red-400 text-center px-4">{error}</p>
      )}
    </div>
  );
}
