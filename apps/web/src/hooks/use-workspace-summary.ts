import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { WorkspaceSummary } from "@/lib/api-types";

export function useWorkspaceSummary(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspace-summary", workspaceId],
    queryFn: () => apiRequest<WorkspaceSummary>(`/workspaces/${workspaceId}/summary`),
    enabled: Boolean(workspaceId),
  });
}
