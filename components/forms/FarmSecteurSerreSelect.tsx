import React from "react";
import { View } from "react-native";
import { FormDropdown } from "./FormDropdown";
import {
  MOCK_FARMS,
  getSecteursByFarm,
  getSerresBySecteur,
} from "@/services/mockData";

interface FarmSecteurSerreSelectProps {
  farmId: string;
  secteurId: string;
  serreId: string;
  onFarmChange: (id: string) => void;
  onSecteurChange: (id: string) => void;
  onSerreChange: (id: string) => void;
  farmError?: string;
  secteurError?: string;
  serreError?: string;
  allowAllSerres?: boolean;
}

export function FarmSecteurSerreSelect({
  farmId,
  secteurId,
  serreId,
  onFarmChange,
  onSecteurChange,
  onSerreChange,
  farmError,
  secteurError,
  serreError,
  allowAllSerres,
}: FarmSecteurSerreSelectProps) {
  const farmOptions = MOCK_FARMS.map((f) => ({ id: f.id, label: f.name }));

  const secteurOptions = farmId
    ? getSecteursByFarm(farmId).map((s) => ({ id: s.id, label: s.name }))
    : [];

  const rawSerres =
    farmId && secteurId
      ? getSerresBySecteur(farmId, secteurId).map((s) => ({
          id: s.id,
          label: s.name,
        }))
      : [];

  const serreOptions = allowAllSerres
    ? [{ id: "all", label: "Toutes les serres" }, ...rawSerres]
    : rawSerres;

  function handleFarmChange(id: string) {
    onFarmChange(id);
    onSecteurChange("");
    onSerreChange("");
  }

  function handleSecteurChange(id: string) {
    onSecteurChange(id);
    onSerreChange("");
  }

  return (
    <View style={{ gap: 12 }}>
      <FormDropdown
        label="Ferme"
        required
        placeholder="Sélectionner une ferme"
        options={farmOptions}
        value={farmId}
        onChange={handleFarmChange}
        error={farmError}
      />

      <FormDropdown
        label="Secteur"
        required
        placeholder={farmId ? "Sélectionner un secteur" : "Choisir une ferme d'abord"}
        options={secteurOptions}
        value={secteurId}
        onChange={handleSecteurChange}
        error={secteurError}
        disabled={!farmId}
      />

      <FormDropdown
        label="Serre"
        required
        placeholder={
          secteurId ? "Sélectionner une serre" : "Choisir un secteur d'abord"
        }
        options={serreOptions}
        value={serreId}
        onChange={onSerreChange}
        error={serreError}
        disabled={!secteurId}
      />
    </View>
  );
}
