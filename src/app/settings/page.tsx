"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useShallow } from "zustand/shallow";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { pullPortfolio, pushPortfolio } from "@/lib/portfolioCloud";
import type { Session } from "@supabase/supabase-js";

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
  const supabase = getSupabaseClient();

  const [email, setEmail] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [authMessage, setAuthMessage] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "pulling" | "pushing" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

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

  const sendMagicLink = async () => {
    if (!supabase) return;
    if (!email) {
      setAuthStatus("error");
      setAuthMessage("Enter an email address first.");
      return;
    }
    setAuthStatus("sending");
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/settings`,
      },
    });
    if (error) {
      setAuthStatus("error");
      setAuthMessage(error.message);
      return;
    }
    setAuthStatus("sent");
    setAuthMessage("Magic link sent. Check your inbox.");
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handlePush = async () => {
    setSyncStatus("pushing");
    setSyncMessage("");
    try {
      await pushPortfolio({
        schemaVersion: 2,
        lots,
        preferences,
        cachedPrices,
      });
      setSyncStatus("idle");
      setSyncMessage("Cloud updated.");
    } catch (error) {
      setSyncStatus("error");
      setSyncMessage((error as Error).message);
    }
  };

  const handlePull = async () => {
    setSyncStatus("pulling");
    setSyncMessage("");
    try {
      const cloudState = await pullPortfolio();
      if (!cloudState) {
        setSyncStatus("idle");
        setSyncMessage("No cloud data yet.");
        return;
      }
      const confirmed = window.confirm("Replace local data with cloud data?");
      if (confirmed) {
        importState(cloudState);
        setSyncMessage("Local data updated from cloud.");
      }
      setSyncStatus("idle");
    } catch (error) {
      setSyncStatus("error");
      setSyncMessage((error as Error).message);
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
        <h3>Cloud sync</h3>
        {!supabase ? (
          <p className="muted">Supabase is not configured.</p>
        ) : session ? (
          <div className={styles.syncBlock}>
            <div className={styles.syncRow}>
              <div>
                <div className={styles.syncLabel}>Signed in</div>
                <div className={styles.syncValue}>{session.user.email}</div>
              </div>
              <Button variant="outline" onClick={signOut}>
                Sign out
              </Button>
            </div>
            <div className={styles.syncActions}>
              <Button variant="outline" onClick={handlePull} disabled={syncStatus === "pulling"}>
                {syncStatus === "pulling" ? "Syncing..." : "Pull from cloud"}
              </Button>
              <Button variant="outline" onClick={handlePush} disabled={syncStatus === "pushing"}>
                {syncStatus === "pushing" ? "Uploading..." : "Push to cloud"}
              </Button>
            </div>
            {syncMessage ? <div className={styles.syncMessage}>{syncMessage}</div> : null}
          </div>
        ) : (
          <div className={styles.syncBlock}>
            <div className={styles.syncRow}>
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={sendMagicLink} disabled={authStatus === "sending"}>
                {authStatus === "sending" ? "Sending..." : "Send magic link"}
              </Button>
            </div>
            {authMessage ? <div className={styles.syncMessage}>{authMessage}</div> : null}
          </div>
        )}
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
