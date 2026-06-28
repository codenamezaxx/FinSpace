# Task 6 Report — Purchase-from-Balance Option

## Changes

### `src/components/wealth/AssetLiabilityForm.tsx`
- **Props extended**: Added `defaultType?: "asset" | "liability"` and `onPurchase?: (data: { name: string; amount: number }) => void`
- **New state**: `purchaseMode` (toggle) and `deductFromBalance` (checkbox)
- **useEffect**: Resets form fields, purchase mode, and applies `defaultType` when modal opens
- **Purchase mode toggle**: Rendered between modal title and form fields. Shows "Pembelian Liabilitas" with description and a toggle switch
- **Conditional rendering**:
  - `purchaseMode = false`: Unchanged existing form (type toggle, name, amount, asset type select)
  - `purchaseMode = true`: Simplified fields — "Nama Liabilitas", "Harga Pembelian (Rp)", "Beli dari Saldo" checkbox
- **handleSave extended**: In purchase mode, saves as `LiabilityEntry` via `onSave`, then calls `onPurchase` if `deductFromBalance` is checked
- **Line count**: 174 → 297 (+123 lines)

### `src/lib/asset-liability-modal-context.tsx`
- **New `ModalOptions` interface**: `{ defaultType?, onPurchase? }`
- **`openAssetLiabilityModal` signature**: Extended to accept optional `ModalOptions`
- **New `modalOptions` state**: Stores options across open/close lifecycle
- **Options pass-through**: `defaultType` and `onPurchase` forwarded to `AssetLiabilityForm`
- **Cleanup**: `close()` resets `modalOptions` to `null`
- **Line count**: 88 → 102 (+14 lines)
- **Backward compatible**: Existing `openAssetLiabilityModal()` calls (no args) continue to work

## Constraints Satisfied
- ✅ All UI labels in Bahasa Indonesia
- ✅ Uses existing `inputClasses` pattern
- ✅ `crypto.randomUUID()` for IDs
- ✅ No hook imports in form component
- ✅ Backward compatible — wealth page unchanged
- ✅ `npm run build` — compiles clean (zero warnings/errors)

## Verification
- **Build**: ✅ Compiles successfully (Turbopack, no errors, no warnings)
- **TypeScript**: ✅ Strict mode passes
- **Static generation**: ✅ All routes generated (no runtime errors)
