import AsyncStorage from "@react-native-async-storage/async-storage";
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
 * Each observation is saved as a "pending sync" item in AsyncStorage.
 *
 * When backend integration is ready:
 * - SyncService reads from these lists and POSTs to the API
 * - On success, items are removed from local storage
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

async function getPendingItems<T>(category: ObservationCategory): Promise<PendingItem<T>[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS[category]);
    return raw ? JSON.parse(raw) : [];
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
  await AsyncStorage.setItem(KEYS[category], JSON.stringify(items));
}

async function removeItemById(category: ObservationCategory, id: string): Promise<void> {
  const items = await getPendingItems<unknown>(category);
  const updated = items.filter((item) => item.id !== id);
  await AsyncStorage.setItem(KEYS[category], JSON.stringify(updated));
}

async function clearCategory(category: ObservationCategory): Promise<void> {
  await AsyncStorage.removeItem(KEYS[category]);
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
  saveVirusObservation: (data: VirusObservation) =>
    savePendingItem("virus", data),

  saveAuxiliaireObservation: (data: AuxiliaireObservation) =>
    savePendingItem("auxiliaire", data),

  saveRavageursObservation: (data: RavageursObservation) =>
    savePendingItem("ravageurs", data),

  saveIrrigationObservation: (data: IrrigationObservation) =>
    savePendingItem("irrigation", data),

  saveInspectionObservation: (data: InspectionObservation) =>
    savePendingItem("inspection", data),

  saveCompteurObservation: (data: CompteurObservation) =>
    savePendingItem("compteur", data),

  // ─────────────────────────────────────────────
  // Getters — used by SyncService
  // ─────────────────────────────────────────────

  getVirusPending: () => getPendingItems<VirusObservation>("virus"),
  getAuxiliairePending: () => getPendingItems<AuxiliaireObservation>("auxiliaire"),
  getRavageursPending: () => getPendingItems<RavageursObservation>("ravageurs"),
  getIrrigationPending: () => getPendingItems<IrrigationObservation>("irrigation"),
  getInspectionPending: () => getPendingItems<InspectionObservation>("inspection"),
  getCompteurPending: () => getPendingItems<CompteurObservation>("compteur"),

  removeItemById,
  clearCategory,
  getUnsyncedCounts,
};
