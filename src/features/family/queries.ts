import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/http";

export type FamilyVisibleProfile = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  occupation?: string | null;
  education?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
};

export type GraphPerson = {
  id: number;
  firstName: string;
  lastName: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN" | string;
  birthDate: string | null;
  deathDate: string | null;
  city: string | null;
  country: string | null;
  claimedProfile?: FamilyVisibleProfile | null; // ✅ add this
};

export type GraphEdge = {
  id: number;
  aId: number;
  bId: number;
  type: "PARENT_OF" | "SPOUSE_OF" | "SIBLING_OF";
};

const keys = {
  graph: (familyId: number) => ["family-graph", familyId] as const,
};

export function useFamilyGraph(familyId: number) {
  return useQuery({
    queryKey: keys.graph(familyId),
    queryFn: () =>
      fetchJSON<{ people: GraphPerson[]; relationships: GraphEdge[] }>(
        `/api/families/${familyId}/graph`
      ),
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      familyId: number;
      firstName: string;
      lastName?: string;
      gender?: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
      birthDate?: string | null;
      deathDate?: string | null;
      city?: string | null;
      country?: string | null;
      bio?: string | null;
    }) =>
      fetchJSON<{ message: string; person: GraphPerson }>(`/api/people`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.graph(vars.familyId) });
    },
  });
}
