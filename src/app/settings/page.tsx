"use client";

import { useRef } from "react";
import styles from "./page.module.css";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useShallow } from "zustand/shallow";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

export default function SettingsPage() {
  const { preferences, setPreferences, reset, cachedPrices, lots, importState } =
    usePortfolioStore(
      useShallow((state) => ({
        preferences: state.preferences,
        setPreferences: state.setPreferences,
        reset: state.reset,
        cachedPrices: state.cachedPrices,
        lots: state.lots,
        importState: state.importState,
      }))
    );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const payload = JSON.stringify(
      {
        schemaVersion: 2,
        lots,
        preferences,
        cachedPrices,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dlta-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importState(data);
      } catch (error) {
        console.warn("Invalid import", error);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    const confirmed = window.confirm("Reset all DLTA data? This cannot be undone.");
    if (confirmed) {
      await reset();
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1>Settings</h1>
        <p className="muted">Tune refresh behavior, display preferences, and data tools.</p>
      </section>

      <section className={styles.card}>
        <h3>Refresh interval</h3>
        <p className="muted">How often DLTA refreshes live prices.</p>
        <Select
          value={preferences.refreshIntervalSeconds}
          onChange={(e) => setPreferences({ refreshIntervalSeconds: Number(e.target.value) })}
        >
          <option value={30}>Every 30 seconds</option>
          <option value={60}>Every 60 seconds</option>
          <option value={120}>Every 2 minutes</option>
          <option value={300}>Every 5 minutes</option>
        </Select>
      </section>

      <section className={styles.card}>
        <h3>Display preferences</h3>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={preferences.showAdvanced}
            onChange={(e) => setPreferences({ showAdvanced: e.target.checked })}
          />
          <span>Show advanced insights</span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={preferences.showNotes}
            onChange={(e) => setPreferences({ showNotes: e.target.checked })}
          />
          <span>Show lot notes</span>
        </label>
      </section>

      <section className={styles.card}>
        <h3>Data tools</h3>
        <div className={styles.actions}>
          <Button variant="outline" onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </Button>
          <Button variant="danger" onClick={handleReset}>
            Reset all data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
      </section>
    </div>
  );
}
