"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { deleteOwnPendingLog, updateOwnPendingLogWithState } from "../actions";

type UpdateActionState = {
  status: "idle" | "success" | "error";
  message: string;
  updatedAt?: string;
};

const initialLogUpdateActionState: UpdateActionState = {
  status: "idle",
  message: "",
};

type ManageLogFormsProps = {
  id: number;
  workDate: string;
  timeIn: string;
  timeOut: string;
  breakMinutes: number;
  notes: string;
};

function UpdateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition duration-150 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-75 active:scale-[0.98]"
    >
      <span className="inline-flex items-center gap-1.5">
        {pending ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" aria-hidden="true" /> : null}
        {pending ? "Updating..." : "Update"}
      </span>
    </button>
  );
}

export default function ManageLogForms({
  id,
  workDate,
  timeIn,
  timeOut,
  breakMinutes,
  notes,
}: ManageLogFormsProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateOwnPendingLogWithState,
    initialLogUpdateActionState,
  );
  const [pressed, setPressed] = useState(false);
  const handledUpdateRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.status === "success" && state.updatedAt && handledUpdateRef.current !== state.updatedAt) {
      handledUpdateRef.current = state.updatedAt;
      router.refresh();
    }
  }, [router, state.status, state.updatedAt]);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
      {state.status !== "idle" ? (
        <p
          className={[
            "rounded-md px-2 py-1 text-[11px] font-medium",
            state.status === "success"
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border border-rose-500/40 bg-rose-500/10 text-rose-300",
          ].join(" ")}
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className={pressed ? "animate-pulse" : ""}>
        <input type="hidden" name="id" value={id} />
        <input
          type="date"
          name="work_date"
          defaultValue={workDate}
          className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="time"
            name="time_in"
            defaultValue={timeIn}
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
          />
          <input
            type="time"
            name="time_out"
            defaultValue={timeOut}
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </div>
        <input
          type="number"
          name="break_minutes"
          min={0}
          defaultValue={breakMinutes}
          className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
        />
        <textarea
          name="notes"
          defaultValue={notes}
          rows={2}
          className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
        />
        <div
          className="mt-2"
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
        >
          <UpdateButton />
        </div>
      </form>

      <form action={deleteOwnPendingLog}>
        <input type="hidden" name="id" value={id} />
        <button className="w-full rounded-md border border-rose-400/60 px-3 py-1.5 text-xs font-semibold text-rose-300">
          Delete
        </button>
      </form>
    </div>
  );
}
