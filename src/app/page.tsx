import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="relative w-full max-w-3xl rounded-4xl border border-slate-700/80 bg-slate-950/80 p-8 shadow-2xl backdrop-blur md:p-12">
        <div className="pointer-events-none absolute -inset-1 rounded-[2.2rem] border border-cyan-400/35 shadow-[0_0_28px_rgba(34,211,238,0.35),0_0_72px_rgba(34,211,238,0.12)]" />
        <div className="pointer-events-none absolute -inset-3 rounded-[2.6rem] border border-blue-400/20 shadow-[0_0_40px_rgba(96,165,250,0.24)]" />

        <p className="relative text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">DTR System</p>
        <h1 className="relative mt-4 text-4xl font-semibold tracking-tight text-slate-100 md:text-5xl">IT Hours Tracker</h1>
        <p className="relative mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
          Track your OJT attendance fast and see rendered hours instantly.
        </p>

        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={user ? "/dashboard" : "/auth/login"}
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {user ? "Open Dashboard" : "Sign in with Google"}
          </Link>
        </div>
      </section>
    </main>
  );
}
