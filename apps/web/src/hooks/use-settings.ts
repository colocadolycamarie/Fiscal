import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface WorkspaceSettings {
  workspaceName: string;
  baseCurrency: string;
  memberCount: number;
  dataPolicy: string;
  retentionDays: number;
}

export function useWorkspaceSettings(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspace-settings", workspaceId],
    queryFn: () => apiRequest<WorkspaceSettings>(`/workspaces/${workspaceId}/settings`),
    enabled: Boolean(workspaceId),
  });
}
