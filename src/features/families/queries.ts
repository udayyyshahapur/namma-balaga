import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/http";

export type Role = "OWNER" | "STEWARD" | "MEMBER";
export type Family = {
  id: number;
  name: string;
  joinCode: string;
  role: Role;
  personId: number | null;
};

const keys = {
  families: ["families"] as const,
};

export function useFamilies() {
  return useQuery({
    queryKey: keys.families,
    queryFn: () => fetchJSON<{ families: Family[] }>("/api/families"),
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      fetchJSON<{ message: string; family: Family }>("/api/families", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.families }),
  });
}

export function useJoinFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      fetchJSON<{ message: string; family: Family }>("/api/families/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.families }),
  });
}

export function useRenameFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: number; name: string }) =>
      fetchJSON<{ message: string }>(`/api/families/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: p.name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.families }),
  });
}

export function useLeaveFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJSON<{ message: string }>(`/api/families/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.families }),
  });
}

export function useDeleteFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJSON<{ message: string }>(`/api/families/${id}?hard=true`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.families }),
  });
}
