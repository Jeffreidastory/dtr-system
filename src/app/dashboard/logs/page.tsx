import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatManilaTime, formatManilaTimeForInput } from "@/lib/datetime";

import { deleteOwnPendingLog, updateOwnPendingLog } from "../actions";

function metricValue(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

type LogRow = {
  id: number;
  work_date: string;
  time_in: string;
  time_out: string | null;
  break_minutes: number;
  rendered_hours: number;
  notes: string | null;
};

export default async function AllLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: logs } = await supabase
    .from("dtr_logs")
    .select("id,work_date,time_in,time_out,break_minutes,rendered_hours,notes")
    .eq("user_id", user.id)
    .order("work_date", { ascending: false });

  const typedLogs: LogRow[] = (logs ?? []).map((log) => ({
    ...log,
    break_minutes: Number(log.break_minutes ?? 0),
    rendered_hours: Number(log.rendered_hours ?? 0),
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-700 bg-slate-950/85 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">DTR System</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">All DTR Records</h1>
              <p className="mt-1 text-sm text-slate-300">Complete attendance history</p>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200">
              Back to dashboard
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-700 bg-slate-950/85 p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">In</th>
                  <th className="px-3 py-2">Out</th>
                  <th className="px-3 py-2">Break</th>
                  <th className="px-3 py-2">Hours</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {typedLogs.map((log) => (
                  <tr key={log.id} className="rounded-xl bg-slate-900/70 text-slate-200">
                    <td className="px-3 py-2 font-medium">{format(new Date(log.work_date), "MMM dd, yyyy")}</td>
                    <td className="px-3 py-2">{formatManilaTime(log.time_in)}</td>
                    <td className="px-3 py-2">{formatManilaTime(log.time_out)}</td>
                    <td className="px-3 py-2">{log.break_minutes ?? 0} min</td>
                    <td className="px-3 py-2">{metricValue(Number(log.rendered_hours ?? 0))}</td>
                    <td className="px-3 py-2 text-xs text-slate-300">{log.notes ?? "-"}</td>
                    <td className="px-3 py-2">
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-cyan-300">Manage</summary>
                        <div className="mt-2 space-y-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
                          <form action={updateOwnPendingLog} className="space-y-2">
                            <input type="hidden" name="id" value={log.id} />
                            <input type="date" name="work_date" defaultValue={String(log.work_date)} className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100" />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="time"
                                name="time_in"
                                defaultValue={formatManilaTimeForInput(log.time_in)}
                                className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
                              />
                              <input
                                type="time"
                                name="time_out"
                                defaultValue={formatManilaTimeForInput(log.time_out)}
                                className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
                              />
                            </div>
                            <input
                              type="number"
                              name="break_minutes"
                              min={0}
                              defaultValue={log.break_minutes}
                              className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                            <textarea
                              name="notes"
                              defaultValue={log.notes ?? ""}
                              rows={2}
                              className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                            <button className="w-full rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950">Update</button>
                          </form>
                          <form action={deleteOwnPendingLog}>
                            <input type="hidden" name="id" value={log.id} />
                            <button className="w-full rounded-md border border-rose-400/60 px-3 py-1.5 text-xs font-semibold text-rose-300">Delete</button>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {typedLogs.length === 0 ? <p className="pt-4 text-sm text-slate-400">No records found.</p> : null}
        </section>
      </div>
    </main>
  );
}
