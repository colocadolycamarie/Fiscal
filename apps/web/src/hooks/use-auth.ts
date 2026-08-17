import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { CurrentUser, Workspace } from "@/lib/api-types";

export const authQueryKey = ["auth", "me"] as const;

interface MeResponse {
  user: CurrentUser;
  workspaces: Workspace[];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: () => apiRequest<MeResponse>("/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => apiRequest<{ user: CurrentUser }>("/auth/login", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authQueryKey }),
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string; workspaceName: string }) =>
      apiRequest<{ user: CurrentUser; workspace: Workspace }>("/auth/signup", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authQueryKey }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => queryClient.clear(),
  });
}
