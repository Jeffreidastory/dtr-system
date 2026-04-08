"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finalizing your sign-in...");

  useEffect(() => {
    let isCancelled = false;

    async function completeAuth() {
      try {
        const supabase = createClient();
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else {
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              throw error;
            }
          } else {
            throw new Error("No auth code or tokens returned from provider.");
          }
        }

        if (!isCancelled) {
          router.replace("/dashboard");
        }
      } catch {
        if (!isCancelled) {
          setMessage("Sign-in failed. Redirecting to home...");
          router.replace("/?error=oauth_callback_failed");
        }
      }
    }

    completeAuth();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-100">Please wait</h1>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-100">Please wait</h1>
            <p className="mt-2 text-sm text-slate-300">Preparing sign-in...</p>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </main>
  );
}
