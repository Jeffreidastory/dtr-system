"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function combineDateAndTime(dateValue: string, timeValue: string) {
  // Persist form times as Philippines local time (UTC+08) to avoid server-timezone shifts.
  return `${dateValue}T${timeValue}:00+08:00`;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return {
    supabase,
    user,
  };
}

export async function addDtrLog(formData: FormData) {
  const { supabase, user } = await getCurrentUser();

  const workDate = String(formData.get("work_date") ?? "").trim();
  const timeIn = String(formData.get("time_in") ?? "").trim();
  const timeOut = String(formData.get("time_out") ?? "").trim();
  const breakMinutes = Number(formData.get("break_minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!workDate || !timeIn) {
    throw new Error("Work date and time in are required.");
  }

  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
    throw new Error("Break minutes must be 0 or greater.");
  }

  const payload = {
    user_id: user.id,
    work_date: workDate,
    time_in: combineDateAndTime(workDate, timeIn),
    time_out: timeOut ? combineDateAndTime(workDate, timeOut) : null,
    break_minutes: Math.floor(breakMinutes),
    notes: notes.length > 0 ? notes : null,
    status: "approved",
  };

  const { error } = await supabase.from("dtr_logs").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/logs");
}

export async function updateOwnPendingLog(formData: FormData) {
  const { supabase, user } = await getCurrentUser();

  const id = Number(formData.get("id"));
  const workDate = String(formData.get("work_date") ?? "").trim();
  const timeIn = String(formData.get("time_in") ?? "").trim();
  const timeOut = String(formData.get("time_out") ?? "").trim();
  const breakMinutes = Number(formData.get("break_minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid log id.");
  }

  if (!workDate || !timeIn) {
    throw new Error("Work date and time in are required.");
  }

  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
    throw new Error("Break minutes must be 0 or greater.");
  }

  const payload = {
    work_date: workDate,
    time_in: combineDateAndTime(workDate, timeIn),
    time_out: timeOut ? combineDateAndTime(workDate, timeOut) : null,
    break_minutes: Math.floor(breakMinutes),
    notes: notes.length > 0 ? notes : null,
  };

  const { error } = await supabase
    .from("dtr_logs")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/logs");
}

export async function updateOwnPendingLogWithState(
  _prevState: { status: "idle" | "success" | "error"; message: string; updatedAt?: string },
  formData: FormData,
): Promise<{ status: "idle" | "success" | "error"; message: string; updatedAt?: string }> {
  try {
    await updateOwnPendingLog(formData);
    return {
      status: "success",
      message: "Record updated successfully.",
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const maybeRedirect = error as { digest?: string };
    if (maybeRedirect?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update record. Please try again.",
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function deleteOwnPendingLog(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const id = Number(formData.get("id"));

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid log id.");
  }

  const { error } = await supabase
    .from("dtr_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/logs");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
