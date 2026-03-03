import { LocalStorageService } from "./LocalStorageService";
import { ApiService } from "./ApiService";
import { LINES, type ObservationCategory } from "@/models";

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
      const response = await apiCall(item.data);
      if (response.success) {
        await LocalStorageService.addToHistory(category, item.data);
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

const TOTAL_LINES_COUNT = 20;

export const SyncService = {
  /**
   * Syncs all pending virus observations to the backend.
   */
  syncVirusObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getVirusPending,
      "virus",
      (data) => {
        const nbr = Number(data.numberOfPlants);
        const count = isNaN(nbr) ? 0 : nbr;
        let autoSeverity = 0;
        if (count >= 1 && count <= 50) autoSeverity = 1;
        else if (count >= 51 && count <= 100) autoSeverity = 2;
        else if (count > 100) autoSeverity = 3;

        const lineValue = (data.selectedLines || []).length >= TOTAL_LINES_COUNT ? "all" : data.selectedLines;

        return ApiService.saveObservation("virus", {
          ferme_id: data.farmId,
          secteur_id: data.secteurId,
          serre_id: [data.serreId],
          virus: count,
          severity: autoSeverity,
          line: lineValue,
          description: data.description,
          photo: data.imageUri,
          date: new Date().toISOString()
        });
      }
    ),

  /**
   * Syncs all pending auxiliaire observations to the backend.
   */
  syncAuxiliaireObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getAuxiliairePending,
      "auxiliaire",
      (data) => {
        // Map population id ("1", "2", "3") to Numeric severity handled by backend
        const severityValue = Number(data.population);
        const lineValue = (data.selectedLines || []).length >= TOTAL_LINES_COUNT ? "all" : data.selectedLines;

        return ApiService.saveObservation("auxiliaire", {
          ferme_id: data.farmId,
          secteur_id: data.secteurId,
          serre_id: [data.serreId],
          type_observation_id: data.typeObservationId,
          severity: severityValue,
          line: lineValue,
          description: data.description,
          photo: data.imageUri,
          date: new Date().toISOString()
        });
      }
    ),

  /**
   * Syncs all pending ravageurs observations to the backend.
   */
  syncRavageursObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getRavageursPending,
      "ravageurs",
      (data) => {
        const lineValue = (data.selectedLines || []).length >= TOTAL_LINES_COUNT ? "all" : data.selectedLines;

        return ApiService.saveObservation("ravageurs", {
          ferme_id: data.farmId,
          secteur_id: data.secteurId,
          serre_id: [data.serreId],
          type_observation_id: data.typeObservationId,
          severity: data.severity,
          line: lineValue,
          description: data.description,
          photo: data.imageUri,
          date: new Date().toISOString()
        });
      }
    ),

  /**
   * Syncs all pending irrigation observations to the backend.
   */
  syncIrrigationObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getIrrigationPending,
      "irrigation",
      (data) => {
        const lineValue = (data.selectedLines || []).length >= TOTAL_LINES_COUNT ? "all" : data.selectedLines;

        return ApiService.saveObservation("irrigation", {
          ferme_id: data.farmId,
          secteur_id: data.secteurId,
          serre_id: [data.serreId],
          line: lineValue,
          date: data.observationDateTime,
          apportVQV: data.supplyVQV,
          apportEC: data.supplyEC,
          apportPH: data.supplyPH,
          drainageVQV: data.drainageVQV,
          drainageEC: data.drainageEC,
          drainagePH: data.drainagePH
        });
      }
    ),

  /**
   * Syncs pending inspection observations.
   */
  syncInspectionObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getInspectionPending,
      "inspection",
      ApiService.createInspectionObservation
    ),

  /**
   * Syncs pending compteur observations.
   */
  syncCompteurObservations: (): Promise<SyncResult> =>
    syncCategory(
      LocalStorageService.getCompteurPending,
      "compteur",
      ApiService.createCompteurObservation
    ),

  /**
   * Sync all categories at once.
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
