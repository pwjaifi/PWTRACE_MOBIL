import { MMKV } from 'react-native-mmkv';
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Global MMKV storage instance.
 * MMKV is a fast, synchronous key-value storage framework.
 */
let _storage: any = null;
try {
    // @ts-ignore - Flagged as type in some environments, but is a class
    _storage = new MMKV({
        id: 'app-storage',
    });
} catch (e) {
    console.log("[Storage] MMKV check: fallback to AsyncStorage enabled.");
}

export const storage = _storage;

/**
 * Helper to serialize objects for MMKV with AsyncStorage fallback.
 */
export const StorageHelper = {
    setString: async (key: string, value: string) => {
        if (storage) {
            try { storage.set(key, value); } catch (e) { }
        }
        await AsyncStorage.setItem(key, value);
    },

    getString: async (key: string): Promise<string | null> => {
        if (storage) {
            try {
                const val = storage.getString(key);
                if (val !== undefined) return val;
            } catch (e) { }
        }
        return await AsyncStorage.getItem(key);
    },

    setObject: async (key: string, value: any) => {
        const json = JSON.stringify(value);
        if (storage) {
            try { storage.set(key, json); } catch (e) { }
        }
        await AsyncStorage.setItem(key, json);
    },

    getObject: async <T>(key: string): Promise<T | null> => {
        let raw = null;
        if (storage) {
            try { raw = storage.getString(key); } catch (e) { }
        }
        if (!raw) {
            raw = await AsyncStorage.getItem(key);
        }
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },

    delete: async (key: string) => {
        if (storage) {
            try { storage.delete(key); } catch (e) { }
        }
        await AsyncStorage.removeItem(key);
    },

    clear: async () => {
        if (storage) {
            try { storage.clearAll(); } catch (e) { }
        }
        await AsyncStorage.clear();
    },
};

