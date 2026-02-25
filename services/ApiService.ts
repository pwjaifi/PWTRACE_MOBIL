import type {
  VirusObservation,
  AuxiliaireObservation,
  RavageursObservation,
  IrrigationObservation,
  InspectionObservation,
  CompteurObservation,
} from "@/models";

/**
 * ApiService - Placeholder service for future backend integration.
 *
 * All methods are prepared for API integration.
 * Replace the placeholder implementations with actual API calls when backend is ready.
 * The offline sync layer can be added by storing pending requests in AsyncStorage
 * and flushing them when connectivity is restored.
 */
export class ApiService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "";

  // ─────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────

  /**
   * @api POST /auth/login
   * Authenticate the user and return a session token.
   */
  static async login(
    _username: string,
    _password: string
  ): Promise<{ token: string; user: { id: string; name: string } }> {
    // TODO: Replace with actual API call
    // return fetch(`${this.baseUrl}/auth/login`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ username, password }),
    // }).then(res => res.json());
    throw new Error("Not implemented - API integration pending");
  }

  // ─────────────────────────────────────────────
  // Reference Data
  // ─────────────────────────────────────────────

  /**
   * @api GET /farms
   * Retrieve list of all farms with secteurs and serres.
   */
  static async getFarms() {
    // TODO: Replace with actual API call
    // return fetch(`${this.baseUrl}/farms`).then(res => res.json());
    throw new Error("Not implemented - API integration pending");
  }

  /**
   * @api GET /observation-types?category={category}
   * Retrieve observation types filtered by category.
   */
  static async getObservationTypes(_category: string) {
    // TODO: Replace with actual API call
    // return fetch(`${this.baseUrl}/observation-types?category=${category}`).then(res => res.json());
    throw new Error("Not implemented - API integration pending");
  }

  /**
   * @api GET /cultures
   * Retrieve list of all cultures.
   */
  static async getCultures() {
    // TODO: Replace with actual API call
    // return fetch(`${this.baseUrl}/cultures`).then(res => res.json());
    throw new Error("Not implemented - API integration pending");
  }

  /**
   * @api GET /compteurs?farmId={farmId}&type={type}
   * Retrieve compteurs filtered by farm and type.
   */
  static async getCompteurs(_farmId: string, _type: "IN" | "OUT") {
    // TODO: Replace with actual API call
    // return fetch(`${this.baseUrl}/compteurs?farmId=${farmId}&type=${type}`).then(res => res.json());
    throw new Error("Not implemented - API integration pending");
  }

  // ─────────────────────────────────────────────
  // Observation Submissions
  // ─────────────────────────────────────────────

  /**
   * @api POST /observations/virus
   * Submit a virus observation.
   * Includes image upload as multipart/form-data if imageUri is provided.
   */
  static async createVirusObservation(
    _data: VirusObservation
  ): Promise<{ id: string; success: boolean }> {
    // TODO: Replace with actual API call
    // const formData = new FormData();
    // formData.append("farmId", data.farmId);
    // formData.append("secteurId", data.secteurId);
    // formData.append("serreId", data.serreId);
    // formData.append("numberOfPlants", String(data.numberOfPlants));
    // formData.append("severity", String(data.severity));
    // formData.append("selectedLines", JSON.stringify(data.selectedLines));
    // formData.append("description", data.description);
    // if (data.imageUri) {
    //   const file = new File(data.imageUri);
    //   formData.append("image", file);
    // }
    // return fetch(`${this.baseUrl}/observations/virus`, {
    //   method: "POST",
    //   body: formData,
    // }).then(res => res.json());
    return simulateApiCall({ id: `virus-${Date.now()}`, success: true });
  }

  /**
   * @api POST /observations/auxiliaire
   * Submit an auxiliaire observation.
   */
  static async createAuxiliaireObservation(
    _data: AuxiliaireObservation
  ): Promise<{ id: string; success: boolean }> {
    // TODO: Replace with actual API call
    return simulateApiCall({ id: `aux-${Date.now()}`, success: true });
  }

  /**
   * @api POST /observations/ravageurs
   * Submit a ravageurs observation.
   */
  static async createRavageursObservation(
    _data: RavageursObservation
  ): Promise<{ id: string; success: boolean }> {
    // TODO: Replace with actual API call
    return simulateApiCall({ id: `rav-${Date.now()}`, success: true });
  }

  /**
   * @api POST /observations/irrigation
   * Submit an irrigation observation.
   */
  static async createIrrigationObservation(
    _data: IrrigationObservation
  ): Promise<{ id: string; success: boolean }> {
    // TODO: Replace with actual API call
    return simulateApiCall({ id: `irr-${Date.now()}`, success: true });
  }

  /**
   * @api POST /observations/inspection
   * Submit an inspection observation with multiple blocks.
   * Each block may contain up to 4 images uploaded as multipart/form-data.
   */
  static async createInspectionObservation(
    _data: InspectionObservation
  ): Promise<{ id: string; success: boolean }> {
    // TODO: Replace with actual API call
    return simulateApiCall({ id: `insp-${Date.now()}`, success: true });
  }

  /**
   * @api POST /observations/compteur
   * Submit a compteur observation.
   */
  static async createCompteurObservation(
    _data: CompteurObservation
  ): Promise<{ id: string; success: boolean }> {
    // TODO: Replace with actual API call
    return simulateApiCall({ id: `cpt-${Date.now()}`, success: true });
  }

  /**
   * @api GET /observations
   * Retrieve list of recent observations.
   */
  static async getObservations(): Promise<unknown[]> {
    // TODO: Replace with actual API call
    return simulateApiCall([]);
  }
}

/**
 * Simulates an API call with a 1 second delay.
 * Remove this when integrating the real backend.
 */
async function simulateApiCall<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 1000));
}
