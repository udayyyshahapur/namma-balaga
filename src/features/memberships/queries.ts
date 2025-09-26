import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/http";

export function useClaimMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload:
      | { mode: "link"; familyId: number; personId: number }
      | { mode: "create"; familyId: number; firstName: string; lastName?: string }
    ) => fetchJSON<{ message: string; personId: number }>("/api/memberships/claim", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    onSuccess: (_data, vars) => {
      // refresh families list so Dashboard shows "Claimed as ..."
      qc.invalidateQueries({ queryKey: ["families"] });
      if ("familyId" in vars) qc.invalidateQueries({ queryKey: ["family-graph", vars.familyId] });
    },
  });
}
