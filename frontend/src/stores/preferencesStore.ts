/**
 * ClickLess AI – Preferences Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PreferenceObject, ExplicitPreferences } from '@/contracts/preferences';

interface PreferencesState {
    preferences: PreferenceObject;
    setExplicit: (partial: Partial<ExplicitPreferences>) => void;
    setAll: (prefs: PreferenceObject) => void;
    reset: () => void;
}

const defaultPrefs: PreferenceObject = {
    explicit: {
        preferred_brands: [],
        avoided_brands: [],
        preferred_sites: [],
        color_preferences: [],
    },
    implicit: {},
    weights: { price: 0.3, rating: 0.3, delivery: 0.2, pref_match: 0.2 },
};

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            preferences: defaultPrefs,
            setExplicit: (partial) =>
                set((s) => ({
                    preferences: {
                        ...s.preferences,
                        explicit: { ...s.preferences.explicit, ...partial } as ExplicitPreferences,
                    },
                })),
            setAll: (prefs) => set({ preferences: prefs }),
            reset: () => set({ preferences: defaultPrefs }),
        }),
        { name: 'cl-preferences' }
    )
);
