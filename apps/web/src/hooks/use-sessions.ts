import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { authQueryKey } from "@/hooks/use-auth";

export interface SessionSummary {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function useSessions() {
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => apiRequest<SessionSummary[]>("/auth/sessions"),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiRequest<void>(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      // Revoking the current session clears its cookie server-side; re-checking
      // /auth/me lets RequireAuth notice and redirect to login automatically.
      queryClient.invalidateQueries({ queryKey: authQueryKey });
    },
  });
}
