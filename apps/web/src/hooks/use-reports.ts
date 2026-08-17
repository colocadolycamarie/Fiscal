import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { Report } from "@/lib/api-types";

function reportsKey(workspaceId: string | undefined) {
  return ["reports", workspaceId] as const;
}

export function useReports(workspaceId: string | undefined) {
  return useQuery({
    queryKey: reportsKey(workspaceId),
    queryFn: () => apiRequest<Report[]>(`/reports?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateReport(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; type: string }) => apiRequest<Report>("/reports", { method: "POST", body: { workspaceId, ...input } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportsKey(workspaceId) }),
  });
}

export function useGenerateReport(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => apiRequest<Report>(`/reports/${reportId}/generate?workspaceId=${workspaceId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportsKey(workspaceId) }),
  });
}
