import type { Farm, ObservationType, Culture, Compteur } from "@/models";

export const MOCK_FARMS: Farm[] = [
  {
    id: "1",
    name: "Ferme Nord",
    secteurs: [
      {
        id: "1",
        name: "Secteur A",
        farmId: "1",
        serres: [
          { id: "1", name: "Serre 1", secteurId: "1", farmId: "1" },
          { id: "2", name: "Serre 2", secteurId: "1", farmId: "1" },
          { id: "3", name: "Serre 3", secteurId: "1", farmId: "1" },
          { id: "4", name: "Serre 4", secteurId: "1", farmId: "1" },
          { id: "5", name: "Serre 5", secteurId: "1", farmId: "1" },
          { id: "6", name: "Serre 6", secteurId: "1", farmId: "1" },
        ],
      },
      {
        id: "2",
        name: "Secteur B",
        farmId: "1",
        serres: [
          { id: "17", name: "Serre 17", secteurId: "2", farmId: "1" },
          { id: "18", name: "Serre 18", secteurId: "2", farmId: "1" },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Ferme Sud",
    secteurs: [
      {
        id: "3",
        name: "Secteur C",
        farmId: "2",
        serres: [
          { id: "38", name: "Serre 38", secteurId: "3", farmId: "2" },
        ],
      },
    ],
  },
];

export const MOCK_OBSERVATION_TYPES: ObservationType[] = [
  { id: "vt1", name: "Mosaique", category: "virus" },
  { id: "vt2", name: "Chlorose", category: "virus" },
  { id: "vt3", name: "Necrose", category: "virus" },

  { id: "at1", name: "Phytoseiidae", category: "auxiliaire" },
  { id: "at2", name: "Coccinellidae", category: "auxiliaire" },
  { id: "at3", name: "Chrysopidae", category: "auxiliaire" },
  { id: "at4", name: "Aphelinidae", category: "auxiliaire" },

  { id: "rt1", name: "Acariens", category: "ravageurs" },
  { id: "rt2", name: "Pucerons", category: "ravageurs" },
  { id: "rt3", name: "Thrips", category: "ravageurs" },
  { id: "rt4", name: "Aleurodes", category: "ravageurs" },
  { id: "rt5", name: "Mineuses", category: "ravageurs" },

  { id: "it1", name: "Goutte-à-goutte", category: "inspection" },
  { id: "it2", name: "Aspersion", category: "inspection" },
  { id: "it3", name: "Substrat", category: "inspection" },
  { id: "it4", name: "Feuillage", category: "inspection" },
  { id: "it5", name: "Racines", category: "inspection" },
  { id: "it6", name: "Structure", category: "inspection" },
];

export const MOCK_CULTURES: Culture[] = [
  { id: "c1", name: "Tomates" },
  { id: "c2", name: "Concombres" },
  { id: "c3", name: "Poivrons" },
  { id: "c4", name: "Aubergines" },
  { id: "c5", name: "Laitues" },
  { id: "c6", name: "Basilic" },
];

export const MOCK_COMPTEURS: Compteur[] = [
  { id: "cp1", name: "Compteur Principal", farmId: "farm1", type: "IN" },
  { id: "cp2", name: "Compteur Secondaire", farmId: "farm1", type: "IN" },
  { id: "cp3", name: "Compteur Drainage 1", farmId: "farm1", type: "OUT" },
  { id: "cp4", name: "Compteur Drainage 2", farmId: "farm1", type: "OUT" },
  { id: "cp5", name: "Compteur Principal", farmId: "farm2", type: "IN" },
  { id: "cp6", name: "Compteur Drainage", farmId: "farm2", type: "OUT" },
  { id: "cp7", name: "Compteur Principal", farmId: "farm3", type: "IN" },
  { id: "cp8", name: "Compteur Drainage", farmId: "farm3", type: "OUT" },
];

export function getFarmById(id: string): Farm | undefined {
  return MOCK_FARMS.find((f) => f.id === id);
}

export function getSecteursByFarm(farmId: string) {
  const farm = getFarmById(farmId);
  return farm?.secteurs ?? [];
}

export function getSerresBySecteur(farmId: string, secteurId: string) {
  const farm = getFarmById(farmId);
  const secteur = farm?.secteurs.find((s) => s.id === secteurId);
  return secteur?.serres ?? [];
}

export function getObservationTypesByCategory(category: string) {
  return MOCK_OBSERVATION_TYPES.filter((t) => t.category === category);
}

export function getCompteursByFarmAndType(farmId: string, type: "IN" | "OUT") {
  return MOCK_COMPTEURS.filter(
    (c) => c.farmId === farmId && c.type === type
  );
}

export function getSerreInfo(serreId: string): {
  serre: { id: string; name: string } | undefined;
  secteur: { id: string; name: string } | undefined;
  farm: { id: string; name: string } | undefined;
} {
  for (const farm of MOCK_FARMS) {
    for (const secteur of farm.secteurs) {
      const serre = secteur.serres.find((s) => s.id === serreId);
      if (serre) {
        return {
          serre: { id: serre.id, name: serre.name },
          secteur: { id: secteur.id, name: secteur.name },
          farm: { id: farm.id, name: farm.name },
        };
      }
    }
  }
  return { serre: undefined, secteur: undefined, farm: undefined };
}

export const ALL_SERRES = MOCK_FARMS.flatMap((farm) =>
  farm.secteurs.flatMap((secteur) => secteur.serres)
);
