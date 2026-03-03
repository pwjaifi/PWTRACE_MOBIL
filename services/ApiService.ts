import type {
  VirusObservation,
  AuxiliaireObservation,
  RavageursObservation,
  IrrigationObservation,
  InspectionObservation,
  CompteurObservation,
} from "@/models";

import { Platform } from "react-native";
import { storage, StorageHelper } from "@/lib/storage";

/**
 * ApiService - Placeholder service for future backend integration.
 */
export class ApiService {
  private static rawBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api";

  // Ensure trailing slash is correctly handled
  private static get baseUrl(): string {
    return ApiService.rawBaseUrl.replace(/\/$/, "");
  }

  static {
    console.log("[ApiService] Initialized with baseUrl:", ApiService.rawBaseUrl);
    if (ApiService.rawBaseUrl.includes("localhost")) {
      console.warn("[ApiService] WARNING: Still using localhost.");
    }
  }

  private static async getHeaders(contentType = "application/json") {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const token = await StorageHelper.getString("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }


  // ─────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────

  /**
   * @api POST /auth/login
   * Authenticate the user and return a session token.
   */
  static async login(
    email: string,
    password: string
  ): Promise<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      categories: string[];
      affectations: { farmId: string; secteurId: string; serreId: string }[];
      affectationsCompteurs?: { farmId: string; compteurId: string }[];
    }
  }> {
    const response = await fetch(`${ApiService.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  }

  /**
   * @api POST /logout
   * Invalidate the session token.
   */
  static async logout(): Promise<{ success: boolean }> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/logout`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      // Even if logout fails on server, we might want to clear local state
      return { success: false };
    }

    return response.json();
  }

  // ─────────────────────────────────────────────
  // Reference Data
  // ─────────────────────────────────────────────

  /**
   * @api GET /farms
   * Retrieve list of all farms with secteurs and serres.
   */
  static async getFarms(): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    console.log("[ApiService] Fetching farms from hosted API...");

    let response = await fetch(`${ApiService.baseUrl}/farms`, { method: "GET", headers });

    // Fallback to /fermes if /farms is 404
    if (response.status === 404) {
      console.log("[ApiService] /farms not found, trying /fermes...");
      response = await fetch(`${ApiService.baseUrl}/fermes`, { method: "GET", headers });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ApiService] Fetch farms failed (${response.status}):`, errText);
      throw new Error(`Failed to fetch farms: ${response.status}`);
    }

    const json = await response.json();
    const data = Array.isArray(json) ? json : (json.data || []);
    console.log(`[ApiService] Successfully loaded ${data.length} farms. Sample:`, JSON.stringify(data[0]).slice(0, 100));
    return data;
  }

  static async getObservationTypes(category: string): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/observation-types?category=${category}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch observation types");
    }

    const json = await response.json();
    return Array.isArray(json) ? json : (json.data || []);
  }

  /**
   * @api GET /serres
   * Retrieve list of all serres.
   */
  static async getSerres(): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/serres`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch serres");
    }

    const json = await response.json();
    return Array.isArray(json) ? json : (json.data || []);
  }

  /**
   * @api GET /cultures
   * Retrieve list of all cultures.
   */
  static async getCultures(): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/cultures`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cultures");
    }

    const json = await response.json();
    return Array.isArray(json) ? json : (json.data || []);
  }

  /**
   * @api GET /serre-details/{id}
   * Retrieve ferme and secteur details for a specific serre.
   */
  static async getSerreDetails(serreId: string): Promise<any> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/serre-details/${serreId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch serre details");
    }

    return response.json();
  }

  /**
   * @api GET /inspection-categories
   * Retrieve categories for inspection (Auth-controlled on backend).
   */
  static async getInspectionCategories(): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/inspection-categories`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch inspection categories");
    }

    return response.json();
  }

  /**
   * @api GET /fermes?type={type}
   * Retrieve farms filtered by meter type (IN/OUT).
   */
  static async getFarmsByType(type: string): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/fermes?type=${type}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch farms by type");
    }

    return response.json();
  }

  /**
   * @api GET /compteurs-by-ferme?ferme_id={ferme_id}&type={type}
   * Retrieve compteurs filtered by farm and type.
   */
  static async getCompteurs(ferme_id: string, type: "IN" | "OUT"): Promise<any[]> {
    const headers = await ApiService.getHeaders();
    const response = await fetch(`${ApiService.baseUrl}/compteurs-by-ferme?ferme_id=${ferme_id}&type=${type}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch compteurs");
    }

    return response.json();
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
    data: VirusObservation
  ): Promise<{ id: string; success: boolean }> {
    const formData = new FormData();
    formData.append("farmId", data.farmId);
    formData.append("secteurId", data.secteurId);
    formData.append("serreId", data.serreId);
    formData.append("numberOfPlants", String(data.numberOfPlants));
    formData.append("severity", String(data.severity));
    formData.append("selectedLines", JSON.stringify(data.selectedLines));
    formData.append("description", data.description);

    if (data.imageUri) {
      // @ts-ignore - React Native FormData expects an object with uri, name, type
      formData.append("image", {
        uri: data.imageUri,
        name: "photo.jpg",
        type: "image/jpeg",
      });
    }

    const headers = await ApiService.getHeaders(""); // Empty string to avoid default JSON content-type
    delete headers["Content-Type"]; // Fetch will automatically set the multipart/form-data boundary

    return fetch(`${ApiService.baseUrl}/observations/virus`, {
      method: "POST",
      headers,
      body: formData,
    }).then((res) => res.json());
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
   * Each block may contain multiple images uploaded as multipart/form-data.
   * Handles BOTH web (Expo Web / browser) and native (Android/iOS) platforms.
   */
  static async createInspectionObservation(
    data: InspectionObservation
  ): Promise<{ id: string; success: boolean }> {
    const formData = new FormData();

    // Format the date to 'YYYY-MM-DD HH:mm:ss'
    const formattedDate = new Date(data.observationDate).toISOString()
      .replace('T', ' ')
      .replace(/\..+/, '');

    // 1. Top-level fields
    formData.append("observation_date", formattedDate);
    formData.append("serre_id", data.serreId);
    formData.append("secteur_id", data.secteurId);
    formData.append("ferme_id", data.farmId);
    formData.append("culture_id", data.cultureId);
    formData.append("weekd", String(data.weekNumber));

    // 2. Loop through each observation block (using for loop so await works for web image conversion)
    for (let index = 0; index < data.observationBlocks.length; index++) {
      const block = data.observationBlocks[index];

      // Backend expects these as arrays
      formData.append("categorie_observation_id[]", block.categoryId);
      formData.append("value_of_type_obs_id[]", block.typeObservationId);

      const mappedStatus = block.status.charAt(0).toUpperCase() + block.status.slice(1); // 'todo' -> 'Todo'
      formData.append("status[]", mappedStatus === "Todo" ? "To Do" : mappedStatus);

      formData.append("remarque[]", block.description || "");
      formData.append("is_fixed[]", "0"); // Default 0 for mobile app for now

      // 3. Handle images per specific block (images_1[], images_2[], etc.)
      const observationNumber = index + 1;
      const imageFieldName = `images_${observationNumber}[]`;

      if (block.imageUris && block.imageUris.length > 0) {
        for (let imgIndex = 0; imgIndex < block.imageUris.length; imgIndex++) {
          const uri = block.imageUris[imgIndex];
          if (!uri) continue;

          const fileName = `insp_${observationNumber}_${imgIndex}.jpg`;

          if (Platform.OS === "web") {
            // WEB: Convert the URI (blob: or data:) to a real File object
            try {
              const response = await fetch(uri);
              const blob = await response.blob();
              const file = new File([blob], fileName, { type: "image/jpeg" });
              formData.append(imageFieldName, file);
              console.log(`[Inspection] Web: appended image ${fileName}, size=${file.size}`);
            } catch (e) {
              console.error(`[Inspection] Web: failed to convert URI for ${fileName}:`, e);
            }
          } else {
            // NATIVE (Android/iOS): Use React Native's {uri, name, type} convention
            // @ts-ignore - React Native FormData expects this specific object shape
            formData.append(imageFieldName, {
              uri: uri,
              name: fileName,
              type: "image/jpeg",
            });
          }
        }
      }
    }

    const headers = await ApiService.getHeaders("");
    delete headers["Content-Type"];

    const response = await fetch(`${ApiService.baseUrl}/observations/inspection`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Inspection API Error:", JSON.stringify(errorData, null, 2));

      let errorMsg = errorData.message || "Failed to submit inspection observation";
      if (errorData.errors) {
        const details = Object.entries(errorData.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        errorMsg += ` (${details})`;
      }

      throw new Error(errorMsg);
    }

    return response.json();
  }

  /**
   * @api POST /observations/compteur
   * Submit a compteur observation.
   */
  static async createCompteurObservation(
    data: CompteurObservation
  ): Promise<{ id: string; success: boolean }> {
    const headers = await ApiService.getHeaders();

    // Format date to 'YYYY-MM-DD HH:mm:ss' for MySQL compatibility
    const date = new Date(data.dateTime);
    const formattedDate = date.toISOString()
      .replace('T', ' ')
      .replace(/\..+/, ''); // Removes milliseconds and 'Z'

    // Transform to match backend controller expectations
    const payload = {
      type_obs: data.compteurType.toLowerCase(),
      ferme_id: data.farmId,
      compteur_id: data.compteurId,
      date: formattedDate,
      V_compt: data.vCompteur,
    };

    const response = await fetch(`${ApiService.baseUrl}/observations/compteur`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to submit compteur observation");
    }

    return response.json();
  }

  /**
   * @api GET /observations
   * Retrieve list of recent observations.
   */
  static async getObservations(): Promise<unknown[]> {
    // TODO: Replace with actual API call
    return simulateApiCall([]);
  }

  /**
   * Helper to convert a local URI to a Base64 string.
   */
  private static async uriToBase64(uri: string): Promise<string> {
    if (!uri || uri.startsWith("data:")) return uri;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error converting URI to Base64:", err);
      return uri;
    }
  }

  /**
   * @api POST /observations/store/{category}
   * Send an observation to the backend.
   */
  static async saveObservation(category: string, data: any): Promise<any> {
    const headers = await ApiService.getHeaders();
    const payload = { ...data };

    // Convert photo to Base64 if it's a local URI
    if (payload.photo && typeof payload.photo === "string" && !payload.photo.startsWith("data:")) {
      payload.photo = await ApiService.uriToBase64(payload.photo);
    }

    const response = await fetch(`${ApiService.baseUrl}/observations/store/${category}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Store Error:", errorText);
      throw new Error(`Failed to save ${category} observation`);
    }

    return response.json();
  }
}

/**
 * Simulates an API call with a 1 second delay.
 * Remove this when integrating the real backend.
 */
async function simulateApiCall<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 1000));
}
