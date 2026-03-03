import { storage, StorageHelper } from "@/lib/storage";
import type {
  VirusObservation,
  AuxiliaireObservation,
  RavageursObservation,
  IrrigationObservation,
  InspectionObservation,
  CompteurObservation,
  ObservationCategory,
} from "@/models";

/**
 * LocalStorageService
 *
 * Handles persisting observations locally (offline-first).
 * Each observation is saved as a "pending sync" item in MMKV.
 *
 * Key format: "pending_<category>" → JSON array of PendingItem<T>
 */

export interface PendingItem<T> {
  id: string;
  data: T;
  savedAt: string;
  retries: number;
}

const KEYS: Record<ObservationCategory, string> = {
  virus: "pending_virus",
  auxiliaire: "pending_auxiliaire",
  ravageurs: "pending_ravageurs",
  irrigation: "pending_irrigation",
  inspection: "pending_inspection",
  compteur: "pending_compteur",
};

const HISTORY_KEY = "synced_history";
const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
  id: string;
  category: ObservationCategory;
  data: any;
  syncedAt: string;
}

async function getPendingItems<T>(category: ObservationCategory): Promise<PendingItem<T>[]> {
  try {
    return (await StorageHelper.getObject<PendingItem<T>[]>(KEYS[category])) || [];
  } catch {
    return [];
  }
}

async function savePendingItem<T>(category: ObservationCategory, data: T): Promise<void> {
  const items = await getPendingItems<T>(category);
  const newItem: PendingItem<T> = {
    id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    data,
    savedAt: new Date().toISOString(),
    retries: 0,
  };
  items.push(newItem);
  await StorageHelper.setObject(KEYS[category], items);
}

async function removeItemById(category: ObservationCategory, id: string): Promise<void> {
  const items = await getPendingItems<unknown>(category);
  const updated = items.filter((item) => item.id !== id);
  await StorageHelper.setObject(KEYS[category], updated);
}

async function clearCategory(category: ObservationCategory): Promise<void> {
  await StorageHelper.setObject(KEYS[category], []);
}

async function getUnsyncedCounts(): Promise<Record<ObservationCategory, number>> {
  const categories: ObservationCategory[] = [
    "virus",
    "auxiliaire",
    "ravageurs",
    "irrigation",
    "inspection",
    "compteur",
  ];

  const counts = await Promise.all(
    categories.map(async (cat) => {
      const items = await getPendingItems(cat);
      return [cat, items.length] as [ObservationCategory, number];
    })
  );

  return Object.fromEntries(counts) as Record<ObservationCategory, number>;
}

// ─────────────────────────────────────────────
// Public save methods — called by each form on submit
// ─────────────────────────────────────────────

export const LocalStorageService = {
  saveVirusObservation: async (data: VirusObservation) =>
    savePendingItem("virus", data),

  saveAuxiliaireObservation: async (data: AuxiliaireObservation) =>
    savePendingItem("auxiliaire", data),

  saveRavageursObservation: async (data: RavageursObservation) =>
    savePendingItem("ravageurs", data),

  saveIrrigationObservation: async (data: IrrigationObservation) =>
    savePendingItem("irrigation", data),

  saveInspectionObservation: async (data: InspectionObservation) =>
    savePendingItem("inspection", data),

  saveCompteurObservation: async (data: CompteurObservation) =>
    savePendingItem("compteur", data),

  // ─────────────────────────────────────────────
  // Getters — used by SyncService
  // ─────────────────────────────────────────────

  getVirusPending: async () => getPendingItems<VirusObservation>("virus"),
  getAuxiliairePending: async () => getPendingItems<AuxiliaireObservation>("auxiliaire"),
  getRavageursPending: async () => getPendingItems<RavageursObservation>("ravageurs"),
  getIrrigationPending: async () => getPendingItems<IrrigationObservation>("irrigation"),
  getInspectionPending: async () => getPendingItems<InspectionObservation>("inspection"),
  getCompteurPending: async () => getPendingItems<CompteurObservation>("compteur"),

  removeItemById: async (cat: any, id: any) => removeItemById(cat, id),
  clearCategory: async (cat: any) => clearCategory(cat),
  getUnsyncedCounts: async () => getUnsyncedCounts(),

  // ─────────────────────────────────────────────
  // Synced History Methods
  // ─────────────────────────────────────────────

  addToHistory: async (category: ObservationCategory, data: any): Promise<void> => {
    try {
      const history = (await StorageHelper.getObject<HistoryItem[]>(HISTORY_KEY)) || [];

      const newItem: HistoryItem = {
        id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category,
        data,
        syncedAt: new Date().toISOString(),
      };

      history.unshift(newItem); // Add to beginning
      const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
      await StorageHelper.setObject(HISTORY_KEY, trimmed);
    } catch (e) {
      console.error("Error adding to history", e);
    }
  },

  getSyncedHistory: async (): Promise<HistoryItem[]> => {
    try {
      return (await StorageHelper.getObject<HistoryItem[]>(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  },

  getAllPending: async (): Promise<PendingItem<any>[]> => {
    const categories: ObservationCategory[] = ["virus", "auxiliaire", "ravageurs", "irrigation", "inspection", "compteur"];
    const all = await Promise.all(categories.map(cat => getPendingItems<any>(cat)));
    return all.flat().sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  },
};

