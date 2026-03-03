import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { ApiService } from "@/services/ApiService";
import { useAuth } from "./AuthContext";
import { StorageHelper } from "@/lib/storage";

export interface DataContextValue {
    serres: any[];
    cultures: any[];
    categories: any[];
    farms: any[];
    ravageurTypes: any[];
    auxiliaireTypes: any[];
    farmsIn: any[];
    farmsOut: any[];
    compteurs: Record<string, any[]>; // farmId_type -> compteurs
    observationTypesMap: Record<string, any[]>; // categoryId -> types
    isLoading: boolean;
    isPreloaded: boolean;
    error: string | null;
    refreshAll: () => Promise<void>;
    getSerreInfo: (id: string) => any;
}

const DataContext = createContext<DataContextValue | null>(null);

const CACHE_KEY = "app_data_cache_v2"; // Incremented version for MMKV migration

export function DataProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [serres, setSerres] = useState<any[]>([]);
    const [cultures, setCultures] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [ravageurTypes, setRavageurTypes] = useState<any[]>([]);
    const [auxiliaireTypes, setAuxiliaireTypes] = useState<any[]>([]);
    const [farmsIn, setFarmsIn] = useState<any[]>([]);
    const [farmsOut, setFarmsOut] = useState<any[]>([]);
    const [compteurs, setCompteurs] = useState<Record<string, any[]>>({});
    const [observationTypesMap, setObservationTypesMap] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isPreloaded, setIsPreloaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper to find a serre and its parent info from the preloaded list
    const getSerreInfo = (id: string) => {
        if (!id || !farms || farms.length === 0) return null;

        const sId = id.toString();
        // Traverse the tree: Farm -> Secteur -> Serre
        for (const farm of farms) {
            const secteurs = farm.children || farm.secteurs || farm.secteur || [];
            for (const secteur of secteurs) {
                const serresList = secteur.children || secteur.serres || secteur.serre || [];
                for (const serre of serresList) {
                    if (serre.id.toString() === sId) {
                        return {
                            serre: { id: serre.id, nom: serre.nomSerre || serre.name || serre.nom || "Serre" },
                            secteur: { id: secteur.id, nom: secteur.nomSecteur || secteur.name || secteur.nom || "Secteur" },
                            ferme: { id: farm.id, nom: farm.nomFerme || farm.name || farm.nom || "Ferme" }
                        };
                    }
                }
            }
        }
        return null;
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadInitialData();
        } else {
            // Clear data on logout
            setSerres([]);
            setCultures([]);
            setCategories([]);
            setFarms([]);
            setRavageurTypes([]);
            setAuxiliaireTypes([]);
            setFarmsIn([]);
            setFarmsOut([]);
            setCompteurs({});
            setObservationTypesMap({});
            setIsPreloaded(false);
        }
    }, [isAuthenticated]);

    async function loadInitialData() {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Load from storage (MMKV with AsyncStorage fallback)
            const cached = await StorageHelper.getObject<any>(CACHE_KEY);
            if (cached) {
                console.log("[DataContext] Loading from local cache...");
                setSerres(cached.serres || []);
                setCultures(cached.cultures || []);
                setCategories(cached.categories || []);
                setFarms(cached.farms || []);
                setRavageurTypes(cached.ravageurTypes || []);
                setAuxiliaireTypes(cached.auxiliaireTypes || []);
                setFarmsIn(cached.farmsIn || []);
                setFarmsOut(cached.farmsOut || []);
                setCompteurs(cached.compteurs || {});
                setObservationTypesMap(cached.observationTypesMap || {});
                setIsPreloaded(true);
            }

            // 2. Refresh in background
            refreshAll().finally(() => setIsLoading(false));

        } catch (e) {
            console.error("Error preloading data:", e);
            setIsLoading(false);
            if (!isPreloaded) {
                setError("Impossible de charger les données locales.");
            }
        }
    }

    async function refreshAll() {
        try {
            console.log("[DataContext] Refreshing data from API...");
            // We fetch everything in parallel
            const [freshSerres, freshCultures, freshCategories, freshFarms, freshRavTypes, freshAuxTypes, freshFarmsIn, freshFarmsOut] = await Promise.all([
                ApiService.getSerres().catch(() => null),
                ApiService.getCultures().catch(() => null),
                ApiService.getInspectionCategories().catch(() => null),
                ApiService.getFarms().catch(() => null),
                ApiService.getObservationTypes("2").catch(() => null),
                ApiService.getObservationTypes("1").catch(() => null),
                ApiService.getFarmsByType("IN").catch(() => null),
                ApiService.getFarmsByType("OUT").catch(() => null)
            ]);

            // CRITICAL: If essential data failed (offline), STOP and preserve cache
            if (!freshSerres && !freshCultures && !freshFarms) {
                console.log("[DataContext] Offline or API error - preserving existing cache");
                return;
            }

            // ONLY update states if we got data
            if (freshSerres) setSerres(freshSerres);
            if (freshCultures) setCultures(freshCultures);
            if (freshCategories) setCategories(freshCategories);
            if (freshFarms) setFarms(freshFarms);
            if (freshRavTypes) setRavageurTypes(freshRavTypes);
            if (freshAuxTypes) setAuxiliaireTypes(freshAuxTypes);
            if (freshFarmsIn) setFarmsIn(freshFarmsIn);
            if (freshFarmsOut) setFarmsOut(freshFarmsOut);

            // Types Map Logic
            let typesMap: Record<string, any[]> = { ...observationTypesMap };
            if (freshCategories && freshCategories.length > 0) {
                const typesResults = await Promise.all(
                    freshCategories.map(cat =>
                        ApiService.getObservationTypes(cat.id.toString())
                            .then(types => ({ id: cat.id.toString(), types }))
                            .catch(() => ({ id: cat.id.toString(), types: null }))
                    )
                );
                typesResults.forEach(res => {
                    if (res.types !== null) {
                        typesMap[res.id] = res.types;
                    }
                });
            }
            if (freshRavTypes) typesMap["ravageurs"] = freshRavTypes;
            if (freshAuxTypes) typesMap["auxiliaire"] = freshAuxTypes;
            setObservationTypesMap(typesMap);

            // Compteurs Logic
            let countsMap: Record<string, any[]> = { ...compteurs };
            const effectiveFarmsIn = freshFarmsIn || farmsIn;
            const effectiveFarmsOut = freshFarmsOut || farmsOut;
            const farmsToFetch = [...(effectiveFarmsIn || []), ...(effectiveFarmsOut || [])];
            const uniqueFarmIds = Array.from(new Set(farmsToFetch.map(f => f.id.toString())));

            if (uniqueFarmIds.length > 0) {
                const inResults = await Promise.all(uniqueFarmIds.map(fid => ApiService.getCompteurs(fid, "IN").catch(() => null)));
                const outResults = await Promise.all(uniqueFarmIds.map(fid => ApiService.getCompteurs(fid, "OUT").catch(() => null)));

                uniqueFarmIds.forEach((fid, idx) => {
                    if (inResults[idx] !== null) countsMap[`${fid}_IN`] = inResults[idx];
                    if (outResults[idx] !== null) countsMap[`${fid}_OUT`] = outResults[idx];
                });
            }
            setCompteurs(countsMap);

            // Save to local cache - Only the fields we actually successfully refreshed
            const currentCache = await StorageHelper.getObject<any>(CACHE_KEY) || {};
            const newData = {
                serres: freshSerres || currentCache.serres || [],
                cultures: freshCultures || currentCache.cultures || [],
                categories: freshCategories || currentCache.categories || [],
                farms: freshFarms || currentCache.farms || [],
                ravageurTypes: freshRavTypes || currentCache.ravageurTypes || [],
                auxiliaireTypes: freshAuxTypes || currentCache.auxiliaireTypes || [],
                farmsIn: freshFarmsIn || currentCache.farmsIn || [],
                farmsOut: freshFarmsOut || currentCache.farmsOut || [],
                compteurs: countsMap,
                observationTypesMap: typesMap,
                updatedAt: new Date().toISOString()
            };

            await StorageHelper.setObject(CACHE_KEY, newData);
            setIsPreloaded(true);
            console.log("[DataContext] Cache updated successfully.");
        } catch (e) {
            console.error("Refresh error:", e);
        }
    }


    const value = useMemo(() => ({
        serres,
        cultures,
        categories,
        farms,
        ravageurTypes,
        auxiliaireTypes,
        farmsIn,
        farmsOut,
        compteurs,
        observationTypesMap,
        isLoading,
        isPreloaded,
        error,
        refreshAll,
        getSerreInfo
    }), [serres, cultures, categories, farms, ravageurTypes, auxiliaireTypes, farmsIn, farmsOut, compteurs, observationTypesMap, isLoading, isPreloaded, error]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData(): DataContextValue {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useData must be used within DataProvider");
    return ctx;
}
