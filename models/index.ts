export interface Farm {
  id: string;
  name: string;
  secteurs: Secteur[];
}

export interface Secteur {
  id: string;
  name: string;
  farmId: string;
  serres: Serre[];
}

export interface Serre {
  id: string;
  name: string;
  secteurId: string;
  farmId: string;
}

export interface Compteur {
  id: string;
  name: string;
  farmId: string;
  type: "IN" | "OUT";
}

export interface ObservationType {
  id: string;
  name: string;
  category: ObservationCategory;
}

export type ObservationCategory =
  | "virus"
  | "auxiliaire"
  | "ravageurs"
  | "irrigation"
  | "inspection"
  | "compteur";

export type SeverityLevel = 0 | 1 | 2 | 3;
export type PopulationLevel = "low" | "medium" | "high";
export type ObservationStatus = "todo" | "normal" | "danger";
export type CompteurType = "IN" | "OUT";

export interface VirusObservation {
  farmId: string;
  secteurId: string;
  serreId: string;
  numberOfPlants: number;
  severity: SeverityLevel;
  selectedLines: string[];
  description: string;
  imageUri?: string;
}

export interface AuxiliaireObservation {
  farmId: string;
  secteurId: string;
  serreId: string;
  typeObservationId: string;
  population: PopulationLevel;
  selectedLines: string[];
  description: string;
  imageUri?: string;
}

export interface RavageursObservation {
  farmId: string;
  secteurId: string;
  serreId: string;
  typeObservationId: string;
  selectedLines: string[];
  severity: SeverityLevel;
  description: string;
  imageUri?: string;
}

export interface IrrigationObservation {
  farmId: string;
  secteurId: string;
  serreId: string;
  supplyVQV: number;
  supplyEC: number;
  supplyPH: number;
  drainageVQV: number;
  drainageEC: number;
  drainagePH: number;
  observationDateTime: Date;
  selectedLines: string[];
}

export interface InspectionObservationBlock {
  id: string;
  categoryId: string;
  typeObservationId: string;
  status: ObservationStatus;
  imageUris: string[];
  description: string;
}

export interface InspectionObservation {
  observationDate: Date;
  weekNumber: number;
  serreId: string;
  farmId: string;
  secteurId: string;
  cultureId: string;
  observationBlocks: InspectionObservationBlock[];
}

export interface CompteurObservation {
  compteurType: CompteurType;
  farmId: string;
  compteurId: string;
  dateTime: Date;
  vCompteur: number;
}

export interface Culture {
  id: string;
  name: string;
}

export interface Line {
  id: string;
  name: string;
}

export const LINES: Line[] = [
  { id: "L1", name: "Ligne 1" },
  { id: "L2", name: "Ligne 2" },
  { id: "L3", name: "Ligne 3" },
  { id: "L4", name: "Ligne 4" },
  { id: "L5", name: "Ligne 5" },
  { id: "L6", name: "Ligne 6" },
  { id: "L7", name: "Ligne 7" },
  { id: "L8", name: "Ligne 8" },
  { id: "L9", name: "Ligne 9" },
  { id: "L10", name: "Ligne 10" },
  { id: "L11", name: "Ligne 11" },
  { id: "L12", name: "Ligne 12" },
  { id: "L13", name: "Ligne 13" },
  { id: "L14", name: "Ligne 14" },
  { id: "L15", name: "Ligne 15" },
  { id: "L16", name: "Ligne 16" },
  { id: "L17", name: "Ligne 17" },
  { id: "L18", name: "Ligne 18" },
  { id: "L19", name: "Ligne 19" },
  { id: "L20", name: "Ligne 20" },
];
