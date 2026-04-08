"use client";

import { useMemo, useState } from "react";

type EstimatedCompletionCardProps = {
  remainingHours: number;
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function computeEstimatedDate(remainingHours: number) {
  const remainingWeeks = remainingHours / 40;
  const daysToAdd = Math.ceil(remainingWeeks * 7);
  const targetDate = new Date();
  targetDate.setHours(0, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() + Math.max(daysToAdd, 0));
  return targetDate;
}

export default function EstimatedCompletionCard({
  remainingHours,
}: EstimatedCompletionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("0");
  const [adjustmentHours, setAdjustmentHours] = useState(0);

  const adjustedRemainingHours = useMemo(
    () => Math.max(remainingHours + adjustmentHours, 0),
    [remainingHours, adjustmentHours],
  );

  const estimatedDate = useMemo(
    () => computeEstimatedDate(adjustedRemainingHours),
    [adjustedRemainingHours],
  );

  function closeModal() {
    setIsModalOpen(false);
    setInputValue("0");
  }

  function submitAdjustment() {
    const parsed = Number(inputValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setAdjustmentHours(parsed);
    setIsModalOpen(false);
  }

  return (
    <>
      <article className="rounded-2xl border border-slate-700 bg-slate-950/85 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          Estimated Completion
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">
          {formatDate(estimatedDate)}
        </p>
        <p className="mt-1 text-xs text-slate-300">Based on 40 hrs/week</p>
        <p className="mt-1 text-sm font-medium text-cyan-300">
          Remaining: {adjustedRemainingHours.toFixed(2)}h
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentHours(0)}
              disabled={adjustmentHours === 0}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore Default
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg border border-cyan-500/60 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500 hover:text-slate-950"
            >
              Adjust Estimate
            </button>
        </div>
      </article>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
            <h4 className="text-lg font-semibold text-slate-100">Adjust Estimate</h4>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-300">
                Missed Hours / Adjustment
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
              />
            </label>
            <p className="mt-2 text-xs text-slate-400">
              Enter total hours you missed (absent, undertime, etc.)
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAdjustment}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
