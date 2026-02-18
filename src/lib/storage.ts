import { openDB } from "idb";
import type { PortfolioState } from "./types";

const DB_NAME = "dlta";
const STORE_NAME = "portfolio";
const KEY = "state";

let memoryFallback: PortfolioState | null = null;

function canUseIndexedDB() {
  return typeof indexedDB !== "undefined";
}

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function loadState(): Promise<PortfolioState | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    if (canUseIndexedDB()) {
      const db = await getDB();
      const state = (await db.get(STORE_NAME, KEY)) as PortfolioState | undefined;
      return state ?? null;
    }
  } catch (error) {
    console.warn("IndexedDB unavailable, falling back to localStorage", error);
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PortfolioState) : memoryFallback;
  } catch (error) {
    console.warn("LocalStorage unavailable, using in-memory state", error);
    return memoryFallback;
  }
}

export async function saveState(state: PortfolioState): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (canUseIndexedDB()) {
      const db = await getDB();
      await db.put(STORE_NAME, state, KEY);
      return;
    }
  } catch (error) {
    console.warn("IndexedDB write failed, falling back to localStorage", error);
  }

  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("LocalStorage write failed, using in-memory state", error);
    memoryFallback = state;
  }
}

export async function clearState(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (canUseIndexedDB()) {
      const db = await getDB();
      await db.delete(STORE_NAME, KEY);
      return;
    }
  } catch (error) {
    console.warn("IndexedDB clear failed", error);
  }

  try {
    window.localStorage.removeItem(KEY);
  } catch (error) {
    console.warn("LocalStorage clear failed", error);
  }

  memoryFallback = null;
}
