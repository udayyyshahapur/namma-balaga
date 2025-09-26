import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/http";

// Optional: describe what the API returns to the client
export type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  occupation?: string | null;
  education?: string | null;
  birthDate?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  allowFamilyView?: boolean;
  email?: string | null; // read-only from account
};

export type SaveProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  occupation?: string;
  education?: string;
  birthDate?: string | null; // "YYYY-MM-DD" or null
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  allowFamilyView?: boolean;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchJSON<{ profile: Profile }>("/api/profile"),
  });
}

export function useSaveProfile() {
  return useMutation({
    mutationFn: (payload: SaveProfilePayload) =>
      fetchJSON<{ message: string; profile: Profile }>("/api/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
