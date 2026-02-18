import { create } from "zustand";
import type { CalculationMode, PortfolioState, Preferences, PurchaseLot } from "@/lib/types";
import { COIN_SYMBOLS } from "@/lib/coins";
import { fetchCurrentPrices } from "@/lib/prices";
import { loadState, saveState, clearState } from "@/lib/storage";
import { isLotInconsistent, normalizeLot } from "@/lib/calculations";
import { clampNumber } from "@/lib/format";

const SCHEMA_VERSION = 2;

const defaultPreferences: Preferences = {
  refreshIntervalSeconds: 60,
  showAdvanced: true,
  showNotes: true,
};

const defaultState: PortfolioState = {
  lots: [],
  preferences: defaultPreferences,
  cachedPrices: {},
  schemaVersion: SCHEMA_VERSION,
};

interface ModalState {
  open: boolean;
  editingId?: string;
}

interface PortfolioStore extends PortfolioState {
  hydrated: boolean;
  priceStatus: "idle" | "loading" | "error";
  priceError?: string;
  modal: ModalState;
  initialize: () => Promise<void>;
  openAddModal: () => void;
  openEditModal: (id: string) => void;
  closeModal: () => void;
  addLot: (lot: Omit<PurchaseLot, "id">, mode?: CalculationMode) => void;
  updateLot: (lot: PurchaseLot, mode?: CalculationMode) => void;
  deleteLot: (id: string) => void;
  setPreferences: (prefs: Partial<Preferences>) => void;
  refreshPrices: (force?: boolean) => Promise<void>;
  importState: (state: PortfolioState) => void;
  reset: () => Promise<void>;
}

function migrateState(state: PortfolioState | null): { state: PortfolioState; didMigrate: boolean } {
  if (!state) {
    return { state: defaultState, didMigrate: false };
  }

  let didMigrate = false;
  const lots = (state.lots ?? []).map((lot) => {
    if (isLotInconsistent(lot, 0.5)) {
      didMigrate = true;
      return {
        ...lot,
        quantity: lot.buyPrice > 0 ? clampNumber(lot.eurSpent / lot.buyPrice, 8) : lot.quantity,
      };
    }
    return lot;
  });

  const nextState: PortfolioState = {
    schemaVersion: SCHEMA_VERSION,
    lots,
    preferences: {
      ...defaultPreferences,
      ...state.preferences,
    },
    cachedPrices: state.cachedPrices ?? {},
  };

  if ((state.schemaVersion ?? 1) < SCHEMA_VERSION) {
    didMigrate = true;
  }

  return { state: nextState, didMigrate };
}

function withPersist(set: (fn: (state: PortfolioStore) => Partial<PortfolioStore>) => void) {
  return (fn: (state: PortfolioStore) => Partial<PortfolioStore>) => {
    set((state) => {
      const next = fn(state);
      const merged = { ...state, ...next } as PortfolioStore;
      const snapshot: PortfolioState = {
        schemaVersion: merged.schemaVersion,
        lots: merged.lots,
        preferences: merged.preferences,
        cachedPrices: merged.cachedPrices,
      };
      void saveState(snapshot);
      return next;
    });
  };
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  ...defaultState,
  hydrated: false,
  priceStatus: "idle",
  priceError: undefined,
  modal: { open: false },
  initialize: async () => {
    const stored = await loadState();
    const { state: migrated, didMigrate } = migrateState(stored);
    set({ ...migrated, hydrated: true });
    if (didMigrate) {
      await saveState(migrated);
    }
  },
  openAddModal: () => set({ modal: { open: true } }),
  openEditModal: (id) => set({ modal: { open: true, editingId: id } }),
  closeModal: () => set({ modal: { open: false } }),
  addLot: (lot, mode = "deriveQuantity") =>
    withPersist(set)((state) => {
      const normalized = normalizeLot(lot, mode);
      return {
        lots: [
          {
            ...normalized,
            id: crypto.randomUUID(),
          },
          ...state.lots,
        ],
      };
    }),
  updateLot: (lot, mode = "deriveQuantity") =>
    withPersist(set)((state) => {
      const normalized = normalizeLot(lot, mode);
      return {
        lots: state.lots.map((item) => (item.id === lot.id ? normalized : item)),
      };
    }),
  deleteLot: (id) =>
    withPersist(set)((state) => ({
      lots: state.lots.filter((item) => item.id !== id),
    })),
  setPreferences: (prefs) =>
    withPersist(set)((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
  refreshPrices: async (force = true) => {
    const { cachedPrices } = get();
    const now = Date.now();
    const shouldFetch = force
      ? true
      : COIN_SYMBOLS.some((symbol) => {
          const entry = cachedPrices[symbol];
          if (!entry) {
            return true;
          }
          const diff = now - new Date(entry.updatedAtISO).getTime();
          return diff > get().preferences.refreshIntervalSeconds * 1000;
        });

    if (!shouldFetch) {
      return;
    }

    set({ priceStatus: "loading", priceError: undefined });
    try {
      const prices = await fetchCurrentPrices();
      withPersist(set)((state) => ({
        cachedPrices: { ...state.cachedPrices, ...prices },
        priceStatus: "idle",
        priceError: undefined,
      }));
    } catch (error) {
      console.warn(error);
      set({ priceStatus: "error", priceError: "Live prices unavailable." });
    }
  },
  importState: (state) =>
    withPersist(set)(() => {
      const { state: migrated } = migrateState(state);
      return {
        ...migrated,
        hydrated: true,
      };
    }),
  reset: async () => {
    await clearState();
    set({ ...defaultState, hydrated: true });
  },
}));
