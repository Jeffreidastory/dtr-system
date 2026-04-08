import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { addDtrLog, deleteOwnPendingLog, signOut, updateOwnPendingLog } from "./actions";
import EstimatedCompletionCard from "./EstimatedCompletionCard";

type LogRow = {
  id: number;
  work_date: string;
  time_in: string;
  time_out: string | null;
  break_minutes: number;
  rendered_hours: number;
  notes: string | null;
};

function metricValue(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function generateStudentId(userId: string) {
  const compact = userId.replace(/-/g, "").toUpperCase();
  return `STU-${compact.slice(0, 8)}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const profileWithStudentId = await supabase
    .from("profiles")
    .select("full_name,email,required_hours,student_id")
    .eq("id", user.id)
    .single();

  const profileFallback =
    profileWithStudentId.error?.code === "42703"
      ? await supabase.from("profiles").select("full_name,email,required_hours").eq("id", user.id).single()
      : null;

  const profile = profileWithStudentId.data ?? profileFallback?.data ?? null;
  let studentId = (profile as { student_id?: string | null } | null)?.student_id ?? null;

  if (!studentId && !profileWithStudentId.error) {
    const generated = generateStudentId(user.id);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ student_id: generated })
      .eq("id", user.id);

    if (!updateError) {
      studentId = generated;
    }
  }

  if (!studentId) {
    studentId = generateStudentId(user.id);
  }

  const [{ data: logs }, { data: allRenderedRows }] = await Promise.all([
    supabase
      .from("dtr_logs")
      .select("id,work_date,time_in,time_out,break_minutes,rendered_hours,notes")
      .eq("user_id", user.id)
      .order("work_date", { ascending: false })
      .limit(12),
    supabase.from("dtr_logs").select("rendered_hours").eq("user_id", user.id),
  ]);

  const typedLogs: LogRow[] = (logs ?? []).map((log) => ({
    ...log,
    break_minutes: Number(log.break_minutes ?? 0),
    rendered_hours: Number(log.rendered_hours ?? 0),
  }));

  const requiredHours = Number(profile?.required_hours ?? 486);
  const renderedHours = (allRenderedRows ?? []).reduce(
    (sum, row) => sum + Number(row.rendered_hours ?? 0),
    0,
  );
  const remainingHours = Math.max(requiredHours - renderedHours, 0);
  const percent = Math.max(0, Math.min(requiredHours > 0 ? (renderedHours / requiredHours) * 100 : 0, 100));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-700 bg-slate-950/85 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">DTR System</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Welcome, {profile?.full_name ?? user.email}</h1>
              <p className="mt-1 text-sm text-slate-300">Google account: {user.email}</p>
              <p className="mt-1 text-sm font-medium text-cyan-300">Student ID: {studentId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={signOut}>
                <button className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl bg-[#0f172a] p-5 text-slate-50 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-300">Required</p>
            <p className="mt-2 text-3xl font-semibold">{metricValue(requiredHours)}h</p>
          </article>
          <article className="rounded-2xl bg-[#0b3b2e] p-5 text-emerald-50 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-emerald-200">Rendered</p>
            <p className="mt-2 text-3xl font-semibold">{metricValue(renderedHours)}h</p>
          </article>
          <article className="rounded-2xl bg-[#9a3412] p-5 text-amber-50 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-amber-200">Remaining</p>
            <p className="mt-2 text-3xl font-semibold">{metricValue(remainingHours)}h</p>
          </article>
          <EstimatedCompletionCard remainingHours={remainingHours} />
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-950/85 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-100">Completion</h2>
            <p className="text-sm font-semibold text-slate-300">{metricValue(percent)}%</p>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-linear-to-r from-[#0ea5e9] via-[#22c55e] to-[#f59e0b]" style={{ width: `${percent}%` }} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_1.6fr]">
          <article className="rounded-3xl border border-slate-700 bg-slate-950/85 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-100">Add DTR Entry</h2>
            <p className="mt-1 text-sm text-slate-300">Entries are counted immediately in your rendered hours.</p>
            <form action={addDtrLog} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-300">Work Date</span>
                <input type="date" name="work_date" required className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Time In</span>
                  <input type="time" name="time_in" required className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Time Out</span>
                  <input type="time" name="time_out" className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500" />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-300">Break Minutes</span>
                <input
                  type="number"
                  name="break_minutes"
                  min={0}
                  defaultValue={0}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-300">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Tasks done today"
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
                />
              </label>
              <button className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">Save Entry</button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-700 bg-slate-950/85 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-100">Recent Logs</h2>
              <Link href="/dashboard/logs" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
                View all records
              </Link>
            </div>
            <p className="mt-1 text-sm text-slate-300">Latest 12 records. You can edit or delete your entries anytime.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">In</th>
                    <th className="px-3 py-2">Out</th>
                    <th className="px-3 py-2">Hours</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {typedLogs.map((log) => (
                    <tr key={log.id} className="rounded-xl bg-slate-900/70 text-slate-200">
                      <td className="px-3 py-2 font-medium">{format(new Date(log.work_date), "MMM dd, yyyy")}</td>
                      <td className="px-3 py-2">{format(new Date(log.time_in), "hh:mm a")}</td>
                      <td className="px-3 py-2">{log.time_out ? format(new Date(log.time_out), "hh:mm a") : "-"}</td>
                      <td className="px-3 py-2">{metricValue(log.rendered_hours)}</td>
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
                                  defaultValue={log.time_in ? format(new Date(log.time_in), "HH:mm") : ""}
                                  className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
                                />
                                <input
                                  type="time"
                                  name="time_out"
                                  defaultValue={log.time_out ? format(new Date(log.time_out), "HH:mm") : ""}
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
              {typedLogs.length === 0 ? <p className="py-4 text-sm text-slate-400">No DTR entries yet.</p> : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
