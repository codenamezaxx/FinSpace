/**
 * Centralized ID generators for Dexie Cloud `@`-prefixed primary keys.
 *
 * Dexie Cloud REJECTS (ConstraintError) any key that does not start with the
 * table-specific prefix — silently breaking saves when invented ad hoc.
 * Verified empirically per table (see ids.test.ts). NEVER invent ID shapes
 * elsewhere; always use these helpers.
 *
 * Prefix map: transactions→trn, assets→ass, liabilities→lbl, debts→dbt,
 * notifications→ntf, ai_queue→aq, pockets→pck (auto-generated, omit id),
 * finny_sessions→fnn, finny_messages→Fnn (case-sensitive!), app_meta→app.
 */

function suffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const newTransactionId = (): string => `trn_${suffix()}`;
export const newAssetId = (): string => `ass${suffix()}`;
export const newLiabilityId = (): string => `lbl${suffix()}`;
export const newDebtId = (): string => `dbt${suffix()}`;
export const newNotificationId = (): string => `ntf${suffix()}`;
export const newAiQueueId = (): string => `aq_${suffix()}`;
export const newFinnySessionId = (): string => `fnn_${suffix()}`;
export const newFinnyUserMessageId = (): string => `Fnnu_${suffix()}`;
export const newFinnyAssistantMessageId = (): string => `Fnna_${suffix()}`;

/** Synced marker key remembering a user-deleted preset pocket. */
export const deletedPresetKey = (name: string): string =>
  `app-deleted-preset:${name}`;

/** Prefix checked by seedPresets when listing deleted-preset markers. */
export const DELETED_PRESET_PREFIX = "app-deleted-preset:";
