"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function autenticar(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "E-mail ou senha invalidos.";
    }
    throw error; // redirect lanca um erro especial que deve propagar
  }
}
