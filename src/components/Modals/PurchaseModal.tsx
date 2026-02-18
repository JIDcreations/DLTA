"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import styles from "./PurchaseModal.module.css";
import { COINS } from "@/lib/coins";
import {
  formatEUR,
  formatInputToISO,
  formatISOToInput,
  formatQty,
  formatPct,
  clampNumber,
} from "@/lib/format";
import { perLotPnL } from "@/lib/calculations";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useShallow } from "zustand/shallow";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { CalculationMode, CoinSymbol } from "@/lib/types";

interface FormState {
  symbol: CoinSymbol;
  datetime: string;
  eurSpent: string;
  buyPrice: string;
  quantity: string;
  note: string;
}

const defaultForm = (): FormState => ({
  symbol: "BTC",
  datetime: formatISOToInput(new Date().toISOString()),
  eurSpent: "",
  buyPrice: "",
  quantity: "",
  note: "",
});

export default function PurchaseModal() {
  const { modal, lots, cachedPrices, addLot, updateLot, closeModal } = usePortfolioStore(
    useShallow((state) => ({
      modal: state.modal,
      lots: state.lots,
      cachedPrices: state.cachedPrices,
      addLot: state.addLot,
      updateLot: state.updateLot,
      closeModal: state.closeModal,
    }))
  );

  const editingLot = useMemo(
    () => lots.find((lot) => lot.id === modal.editingId),
    [lots, modal.editingId]
  );

  const [form, setForm] = useState<FormState>(defaultForm());
  const [calcMode, setCalcMode] = useState<CalculationMode>("deriveQuantity");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (modal.open) {
      const nextForm = editingLot
        ? {
            symbol: editingLot.symbol,
            datetime: formatISOToInput(editingLot.datetimeISO),
            eurSpent: editingLot.eurSpent.toString(),
            buyPrice: editingLot.buyPrice.toString(),
            quantity: editingLot.quantity.toString(),
            note: editingLot.note ?? "",
          }
        : defaultForm();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(nextForm);
      setCalcMode("deriveQuantity");
      setErrors({});
    }
  }, [modal.open, editingLot]);

  const livePrice = cachedPrices[form.symbol]?.eur;
  const eurSpentValue = Number(form.eurSpent) || 0;
  const buyPriceValue = Number(form.buyPrice) || 0;
  const quantityValue = Number(form.quantity) || 0;

  const derivedQuantityValue =
    form.eurSpent && buyPriceValue > 0 ? clampNumber(eurSpentValue / buyPriceValue, 8) : 0;
  const derivedQuantityString =
    form.eurSpent && buyPriceValue > 0 ? derivedQuantityValue.toFixed(8) : "";

  const derivedEurSpentValue =
    form.quantity && buyPriceValue > 0 ? clampNumber(quantityValue * buyPriceValue, 2) : 0;
  const derivedEurSpentString =
    form.quantity && buyPriceValue > 0 ? derivedEurSpentValue.toFixed(2) : "";

  const displayQuantity = calcMode === "deriveQuantity" ? derivedQuantityString : form.quantity;
  const displayEurSpent = calcMode === "deriveEur" ? derivedEurSpentString : form.eurSpent;

  const effectiveQuantityValue =
    calcMode === "deriveQuantity" ? derivedQuantityValue : quantityValue;
  const effectiveEurSpentValue =
    calcMode === "deriveEur" ? derivedEurSpentValue : eurSpentValue;

  const previewLot = {
    id: "preview",
    symbol: form.symbol,
    datetimeISO: new Date().toISOString(),
    eurSpent: effectiveEurSpentValue,
    buyPrice: buyPriceValue,
    quantity: effectiveQuantityValue,
    note: form.note || undefined,
  };

  const previewPnL = perLotPnL(previewLot, livePrice);

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleModeChange = (mode: CalculationMode) => {
    if (mode === calcMode) return;
    if (mode === "deriveEur" && !form.quantity && derivedQuantityString) {
      setForm((prev) => ({ ...prev, quantity: derivedQuantityString }));
    }
    if (mode === "deriveQuantity" && !form.eurSpent && derivedEurSpentString) {
      setForm((prev) => ({ ...prev, eurSpent: derivedEurSpentString }));
    }
    setCalcMode(mode);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.symbol) nextErrors.symbol = "Pick a coin.";
    if (!form.datetime) nextErrors.datetime = "Choose a date/time.";
    if (buyPriceValue <= 0) nextErrors.buyPrice = "Enter a buy price.";

    if (calcMode === "deriveQuantity") {
      if (eurSpentValue <= 0) nextErrors.eurSpent = "Enter EUR spent.";
      if (derivedQuantityValue <= 0) nextErrors.quantity = "Quantity must be > 0.";
    } else {
      if (quantityValue <= 0) nextErrors.quantity = "Enter a quantity.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      symbol: form.symbol,
      datetimeISO: formatInputToISO(form.datetime),
      eurSpent: effectiveEurSpentValue,
      buyPrice: buyPriceValue,
      quantity: effectiveQuantityValue,
      note: form.note ? form.note.trim() : undefined,
    };

    if (editingLot) {
      updateLot({ ...editingLot, ...payload }, calcMode);
    } else {
      addLot(payload, calcMode);
    }
    closeModal();
  };

  const buyPriceWarning = (() => {
    if (!buyPriceValue) return "";
    if (form.symbol === "BTC" && buyPriceValue < 1000) {
      return "BTC price seems too low—did you mean 55,000?";
    }
    if (form.symbol === "ETH" && buyPriceValue < 10) {
      return "ETH price seems too low—did you mean 1,800?";
    }
    if (form.symbol === "XRP" && buyPriceValue > 1000) {
      return "XRP price seems too high—double-check the unit.";
    }
    return "";
  })();

  const quantityWarning =
    form.symbol === "BTC" && effectiveQuantityValue > 0.1 && effectiveEurSpentValue < 1000
      ? "This implies more than 0.1 BTC for under €1,000—double-check the price."
      : "";

  return (
    <AnimatePresence>
      {modal.open ? (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className={styles.modal}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className={styles.header}>
              <div>
                <h2>{editingLot ? "Edit Purchase" : "Add Purchase"}</h2>
                <p className="muted">Capture the exact lot details with a live preview.</p>
              </div>
              <button className={styles.close} onClick={closeModal} aria-label="Close modal">
                ✕
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.form}>
                <div className={styles.modeToggle}>
                  <span className={styles.modeLabel}>Calculation mode</span>
                  <div className={styles.modeButtons}>
                    <button
                      type="button"
                      className={`${styles.modeButton} ${calcMode === "deriveQuantity" ? styles.active : ""}`}
                      onClick={() => handleModeChange("deriveQuantity")}
                      aria-pressed={calcMode === "deriveQuantity"}
                    >
                      Auto quantity
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeButton} ${calcMode === "deriveEur" ? styles.active : ""}`}
                      onClick={() => handleModeChange("deriveEur")}
                      aria-pressed={calcMode === "deriveEur"}
                    >
                      Auto EUR
                    </button>
                  </div>
                </div>

                <Field label="Coin" error={errors.symbol}>
                  <Select value={form.symbol} onChange={(e) => updateForm("symbol", e.target.value as CoinSymbol)}>
                    {COINS.map((coin) => (
                      <option key={coin.symbol} value={coin.symbol}>
                        {coin.symbol} — {coin.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date & time" error={errors.datetime}>
                  <Input
                    type="datetime-local"
                    value={form.datetime}
                    onChange={(e) => updateForm("datetime", e.target.value)}
                  />
                </Field>
                <Field
                  label={
                    <span className={styles.labelRow}>
                      EUR spent
                      {calcMode === "deriveEur" ? <span className={styles.autoTag}>Auto-calculated</span> : null}
                    </span>
                  }
                  error={errors.eurSpent}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={displayEurSpent}
                    readOnly={calcMode === "deriveEur"}
                    onChange={(e) => updateForm("eurSpent", e.target.value)}
                    placeholder="2500"
                  />
                </Field>
                <Field label="Buy price (EUR)" error={errors.buyPrice}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={form.buyPrice}
                    onChange={(e) => updateForm("buyPrice", e.target.value)}
                    placeholder="40000"
                  />
                  {buyPriceWarning ? <span className={styles.warningText}>{buyPriceWarning}</span> : null}
                </Field>
                <Field
                  label={
                    <span className={styles.labelRow}>
                      Quantity
                      {calcMode === "deriveQuantity" ? <span className={styles.autoTag}>Auto-calculated</span> : null}
                    </span>
                  }
                  error={errors.quantity}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={displayQuantity}
                    readOnly={calcMode === "deriveQuantity"}
                    onChange={(e) => updateForm("quantity", e.target.value)}
                    placeholder="0.0625"
                  />
                  {quantityWarning ? <span className={styles.warningText}>{quantityWarning}</span> : null}
                </Field>
                <Field label="Note" hint="Optional context for this lot.">
                  <Input
                    type="text"
                    value={form.note}
                    onChange={(e) => updateForm("note", e.target.value)}
                    placeholder="Crash 1"
                  />
                </Field>
              </div>

              <div className={styles.preview}>
                <h4>Live preview</h4>
                <div className={styles.previewCard}>
                  <div>
                    <span className={styles.previewLabel}>This equals</span>
                    <strong className="mono">{formatQty(effectiveQuantityValue)} coins</strong>
                  </div>
                  <div>
                    <span className={styles.previewLabel}>Invested</span>
                    <strong className="mono">{formatEUR(effectiveEurSpentValue)}</strong>
                  </div>
                  <div>
                    <span className={styles.previewLabel}>Current price</span>
                    <strong className="mono">{livePrice ? formatEUR(livePrice) : "—"}</strong>
                  </div>
                  <div>
                    <span className={styles.previewLabel}>Lot P/L</span>
                    <strong className={`mono ${previewPnL.eur >= 0 ? "positive" : "negative"}`}>
                      {livePrice ? formatEUR(previewPnL.eur) : "—"}
                    </strong>
                    <span className={styles.previewPct}>
                      {livePrice ? formatPct(previewPnL.pct) : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingLot ? "Save changes" : "Add purchase"}</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
