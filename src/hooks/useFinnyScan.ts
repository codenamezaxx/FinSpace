"use client";
import { useState, useCallback } from "react";
import type { PocketInfo } from "./useFinnyChat";

interface ScanResult {
  action: string;
  message: string;
  data?: Record<string, unknown>;
  confidence?: string;
}

export function useFinnyScan() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanImage = useCallback(async (imageDataUrl: string, pockets?: PocketInfo[]) => {
    if (!imageDataUrl) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/ai/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, pockets: pockets ?? [] }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && typeof data.message === "string") {
          setResult({ action: data.action ?? "chat", message: data.message, confidence: "low" });
          setIsLoading(false); return;
        }
        throw new Error(typeof data.error === "string" ? data.error : "Gagal scan struk");
      }
      setResult(data);
    } catch (err) {
      setError((err as Error).message || "Gagal scan struk. Coba lagi ya!");
    } finally { setIsLoading(false); }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, isLoading, error, scanImage, reset };
}
