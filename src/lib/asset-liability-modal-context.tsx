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
import { db } from "@/lib/db";

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
    async (item: AssetEntry | LiabilityEntry) => {
      if ("type" in item) {
        await db.assets.put(item);
      } else {
        await db.liabilities.put(item);
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
