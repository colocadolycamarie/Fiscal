import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { AlertFiring, AlertRule } from "@/lib/api-types";

function rulesKey(workspaceId: string | undefined) {
  return ["alert-rules", workspaceId] as const;
}
function feedKey(workspaceId: string | undefined) {
  return ["alert-feed", workspaceId] as const;
}

export function useAlertRules(workspaceId: string | undefined) {
  return useQuery({
    queryKey: rulesKey(workspaceId),
    queryFn: () => apiRequest<AlertRule[]>(`/alerts/rules?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useAlertFeed(workspaceId: string | undefined) {
  return useQuery({
    queryKey: feedKey(workspaceId),
    queryFn: () => apiRequest<AlertFiring[]>(`/alerts/feed?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateAlertRule(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { metricKey: string; condition: AlertRule["condition"]; thresholdValue: number; channel?: string }) =>
      apiRequest<AlertRule>("/alerts/rules", { method: "POST", body: { workspaceId, ...input } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rulesKey(workspaceId) }),
  });
}

export function useToggleAlertRule(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { ruleId: string; active: boolean }) =>
      apiRequest<AlertRule>(`/alerts/rules/${input.ruleId}?workspaceId=${workspaceId}`, { method: "PATCH", body: { active: input.active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rulesKey(workspaceId) }),
  });
}
