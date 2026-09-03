"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/shared/lib/audit/record-audit";
import { createClient } from "@/shared/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: (parsed.error.issues[0] as { message: string }).message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error !== null) {
    return {
      status: "error",
      message:
        "Credenciales inválidas. Si no tienes cuenta, solicita el alta al administrador de tu área.",
    };
  }

  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);
  await recordAudit(supabase, {
    action: "login",
    entityType: "session",
    entityId: data.user.id,
  });

  redirect("/");
}
