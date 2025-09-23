import { useMutation } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/http";
import { signIn } from "next-auth/react";

export function useSignUp() {
  return useMutation({
    mutationFn: (payload: { name?: string; email: string; password: string }) =>
      fetchJSON<{ message: string; user: { id: number; email: string; name: string | null } }>(
        "/api/register",
        { method: "POST", body: JSON.stringify(payload) }
      ),
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await signIn("credentials", { ...payload, redirect: false });
      if (res?.error) throw new Error(res.error);
      return { message: "Signed in" };
    },
  });
}
