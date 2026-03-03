import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { FormDropdown } from "./FormDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Colors } from "@/constants/colors";

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
  const { user } = useAuth();
  const { farms, isPreloaded, isLoading: isGlobalLoading } = useData();

  const affectations = (user?.affectations || []) as any[];
  const hasSpecificAffectations = affectations.length > 0;

  // Filter Farm Options
  const farmOptions = React.useMemo(() => {
    console.log("[FarmSelect] Raw farms count from server:", farms.length);
    if (farms.length > 0) {
      console.log("[FarmSelect] Server Farm IDs:", farms.map(f => f.id).join(", "));
    }

    const filtered = farms.filter((f) => {
      if (!hasSpecificAffectations) return true;

      const isMatch = affectations.some((a) => {
        const aId = (a.farmId || a.ferme_id || a.id)?.toString();
        const fId = f.id.toString();
        return aId === fId;
      });

      if (!isMatch) {
        console.log(`[FarmSelect] Hiding Farm ${f.id} (${f.name || f.nom}) - Not in user affectations`);
      }
      return isMatch;
    });

    console.log("[FarmSelect] Final visible farms:", filtered.length);
    if (filtered.length === 0 && hasSpecificAffectations && farms.length > 0) {
      console.warn("[FarmSelect] CRITICAL: You have farms on server but NONE match your User Profile!");
      console.log("[FarmSelect] Your Profile 'affectations':", JSON.stringify(affectations));
    }

    return filtered.map((f) => ({
      id: f.id.toString(),
      label: f.name || f.nom || f.nomFerme || `Ferme ${f.id}`
    }));
  }, [farms, affectations, hasSpecificAffectations]);

  // Filter Secteur Options
  const secteurOptions = React.useMemo(() => {
    if (!farmId) return [];

    const selectedFarm = farms.find(f => f.id.toString() === farmId);
    if (!selectedFarm) return [];

    // Flexible child lookup
    const allSecteurs = selectedFarm.children || selectedFarm.secteurs || selectedFarm.secteur || [];
    console.log(`[FarmSelect] Farm ${farmId} secteurs count:`, allSecteurs.length);

    return allSecteurs
      .filter((s: any) => {
        if (!hasSpecificAffectations) return true;
        return affectations.some((a: any) =>
          (a.farmId || a.ferme_id)?.toString() === farmId &&
          (a.secteurId || a.secteur_id)?.toString() === s.id.toString()
        );
      })
      .map((s: any) => ({
        id: s.id.toString(),
        label: s.name || s.nom || s.nomSecteur || `Secteur ${s.id}`
      }));
  }, [farmId, farms, affectations, hasSpecificAffectations]);

  // Filter Serre Options
  const serreOptions = React.useMemo(() => {
    if (!farmId || !secteurId) return [];

    const selectedFarm = farms.find(f => f.id.toString() === farmId);
    if (!selectedFarm) return [];

    // Flexible child lookup for secteur
    const allSecteurs = selectedFarm.children || selectedFarm.secteurs || selectedFarm.secteur || [];
    const selectedSecteur = allSecteurs.find((s: any) => s.id.toString() === secteurId);
    if (!selectedSecteur) return [];

    // Flexible child lookup for serre
    const allSerres = selectedSecteur.children || selectedSecteur.serres || selectedSecteur.serre || [];
    console.log(`[FarmSelect] Secteur ${secteurId} serres count:`, allSerres.length);

    const filteredRaw = allSerres.filter((s: any) => {
      if (!hasSpecificAffectations) return true;
      return affectations.some(
        (a: any) =>
          (a.farmId || a.ferme_id)?.toString() === farmId &&
          (a.secteurId || a.secteur_id)?.toString() === secteurId &&
          (a.serreId || a.serre_id)?.toString() === s.id.toString()
      );
    });

    const formatted = filteredRaw.map((s: any) => ({
      id: s.id.toString(),
      label: s.name || s.nom || s.nomSerre || `Serre ${s.id}`
    }));

    if (allowAllSerres && !hasSpecificAffectations) {
      return [{ id: "all", label: "Toutes les serres" }, ...formatted];
    }
    return formatted;
  }, [farmId, secteurId, farms, affectations, hasSpecificAffectations, allowAllSerres]);

  function handleFarmChange(id: string) {
    onFarmChange(id);
    onSecteurChange("");
    onSerreChange("");
  }

  function handleSecteurChange(id: string) {
    onSecteurChange(id);
    onSerreChange("");
  }

  if (!isPreloaded && isGlobalLoading) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} size="small" />
        <Text style={{ marginTop: 8, fontSize: 12, color: Colors.textSecondary }}>Chargement des fermes...</Text>
      </View>
    );
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
