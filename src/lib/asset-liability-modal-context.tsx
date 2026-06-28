"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AssetLiabilityForm } from "@/components/wealth/AssetLiabilityForm";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";

const ASSETS_KEY = "finspace_assets";
const LIABILITIES_KEY = "finspace_liabilities";
const UPDATE_EVENT = "finspace-assets-updated";

interface ModalOptions {
  defaultType?: "asset" | "liability";
  onPurchase?: (data: { name: string; amount: number }) => void;
  currentBalance?: number;
}

interface AssetLiabilityModalContextValue {
  openAssetLiabilityModal: (options?: ModalOptions) => void;
}

const AssetLiabilityModalContext =
  createContext<AssetLiabilityModalContextValue | null>(null);

function dispatchUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }
}

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AssetLiabilityModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const openAssetLiabilityModal = useCallback((options?: ModalOptions) => {
    setModalOptions(options ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setModalOptions(null);
    setIsOpen(false);
  }, []);

  const handleSave = useCallback(
    (item: AssetEntry | LiabilityEntry) => {
      if ("type" in item) {
        const assets = loadFromStorage<AssetEntry>(ASSETS_KEY, []);
        assets.push(item);
        localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
      } else {
        const liabilities = loadFromStorage<LiabilityEntry>(
          LIABILITIES_KEY,
          []
        );
        liabilities.push(item);
        localStorage.setItem(LIABILITIES_KEY, JSON.stringify(liabilities));
      }
      dispatchUpdate();
      close();
    },
    [close]
  );

  return (
    <AssetLiabilityModalContext.Provider value={{ openAssetLiabilityModal }}>
      {children}
      <AssetLiabilityForm
        isOpen={isOpen}
        onClose={close}
        onSave={handleSave}
        defaultType={modalOptions?.defaultType}
        onPurchase={modalOptions?.onPurchase}
        currentBalance={modalOptions?.currentBalance}
      />
    </AssetLiabilityModalContext.Provider>
  );
}

export function useAssetLiabilityModal(): AssetLiabilityModalContextValue {
  const ctx = useContext(AssetLiabilityModalContext);
  if (!ctx)
    throw new Error(
      "useAssetLiabilityModal must be used within AssetLiabilityModalProvider"
    );
  return ctx;
}
