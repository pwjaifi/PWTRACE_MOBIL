import { LocalStorageService } from "./LocalStorageService";
import { ApiService } from "./ApiService";
import type { ObservationCategory } from "@/models";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * SyncService
 *
 * Handles syncing locally-stored observations to the backend API.
 * Each category has its own sync method for independent, targeted sync.
 *
 * Architecture notes:
 * - Each method reads pending items from LocalStorageService
 * - Sends each to the appropriate ApiService method
 * - On success: removes from local storage
 * - On failure: increments retry counter, leaves in local storage
 *
 * Future improvements:
 * - Add exponential backoff for retries
 * - Add network connectivity check before syncing
 * - Add conflict resolution for items modified on server
 * - Add background sync via expo-task-manager
 */

async function syncCategory<T>(
  getPending: () => Promise<{ id: string; data: T }[]>,
  category: ObservationCategory,
  apiCall: (data: T) => Promise<{ id: string; success: boolean }>
): Promise<SyncResult> {
  const pending = await getPending();
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  for (const item of pending) {
    try {
      // API integration point — each item is sent to the backend
      const response = await apiCall(item.data);
      if (response.success) {
        await LocalStorageService.removeItemById(category, item.id);
        result.synced++;
      } else {
        result.failed++;
        result.errors.push(`Item ${item.id}: server returned failure`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(`Item ${item.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return result;
}

export const SyncService = {
  /**
   * @api POST /observations/virus (batch or per-item)
   * Syncs all pending virus observations to the backend.
   */
  syncVirusObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getVirusPending,
      "virus",
      ApiService.createVirusObservation
    ),

  /**
   * @api POST /observations/auxiliaire
   * Syncs all pending auxiliaire observations to the backend.
   */
  syncAuxiliaireObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getAuxiliairePending,
      "auxiliaire",
      ApiService.createAuxiliaireObservation
    ),

  /**
   * @api POST /observations/ravageurs
   * Syncs all pending ravageurs observations to the backend.
   */
  syncRavageursObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getRavageursPending,
      "ravageurs",
      ApiService.createRavageursObservation
    ),

  /**
   * @api POST /observations/irrigation
   * Syncs all pending irrigation observations to the backend.
   */
  syncIrrigationObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getIrrigationPending,
      "irrigation",
      ApiService.createIrrigationObservation
    ),

  /**
   * @api POST /observations/inspection
   * Syncs all pending inspection observations to the backend.
   */
  syncInspectionObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getInspectionPending,
      "inspection",
      ApiService.createInspectionObservation
    ),

  /**
   * @api POST /observations/compteur
   * Syncs all pending compteur observations to the backend.
   */
  syncCompteurObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getCompteurPending,
      "compteur",
      ApiService.createCompteurObservation
    ),

  /**
   * Sync all categories at once.
   * Returns an aggregate result per category.
   */
  syncAll: async (): Promise<Record<ObservationCategory, SyncResult>> => {
    const [virus, auxiliaire, ravageurs, irrigation, inspection, compteur] =
      await Promise.all([
        SyncService.syncVirusObservations(),
        SyncService.syncAuxiliaireObservations(),
        SyncService.syncRavageursObservations(),
        SyncService.syncIrrigationObservations(),
        SyncService.syncInspectionObservations(),
        SyncService.syncCompteurObservations(),
      ]);

    return { virus, auxiliaire, ravageurs, irrigation, inspection, compteur };
  },
};
