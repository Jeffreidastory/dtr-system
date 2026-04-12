import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function getAppBaseUrl(request: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "missing_env");
    return NextResponse.redirect(url);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const redirectTo = `${getAppBaseUrl(request)}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "oauth_start_failed");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(data.url);
}
