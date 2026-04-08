import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function metricValue(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

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
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log) => (
                  <tr key={log.id} className="rounded-xl bg-slate-900/70 text-slate-200">
                    <td className="px-3 py-2 font-medium">{format(new Date(log.work_date), "MMM dd, yyyy")}</td>
                    <td className="px-3 py-2">{format(new Date(log.time_in), "hh:mm a")}</td>
                    <td className="px-3 py-2">{log.time_out ? format(new Date(log.time_out), "hh:mm a") : "-"}</td>
                    <td className="px-3 py-2">{log.break_minutes ?? 0} min</td>
                    <td className="px-3 py-2">{metricValue(Number(log.rendered_hours ?? 0))}</td>
                    <td className="px-3 py-2 text-xs text-slate-300">{log.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(logs ?? []).length === 0 ? <p className="pt-4 text-sm text-slate-400">No records found.</p> : null}
        </section>
      </div>
    </main>
  );
}
