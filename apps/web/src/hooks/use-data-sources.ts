import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { DataSource } from "@/lib/api-types";

function dataSourcesKey(workspaceId: string | undefined) {
  return ["data-sources", workspaceId] as const;
}

export function useDataSources(workspaceId: string | undefined) {
  return useQuery({
    queryKey: dataSourcesKey(workspaceId),
    queryFn: () => apiRequest<DataSource[]>(`/data-sources?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateDataSource(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { provider: string; label: string }) =>
      apiRequest<DataSource>("/data-sources", { method: "POST", body: { workspaceId, ...input } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dataSourcesKey(workspaceId) }),
  });
}

export function useImportLedgerCsv(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { dataSourceId: string; csv: string }) =>
      apiRequest<{ dataSource: DataSource; rowsImported: number; alertsTriggered: number }>(`/data-sources/${input.dataSourceId}/import`, {
        method: "POST",
        body: { csv: input.csv },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataSourcesKey(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ["workspace-summary", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["metrics", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["alert-feed", workspaceId] });
    },
  });
}

export function useResyncDataSource(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dataSourceId: string) => apiRequest<DataSource>(`/data-sources/${dataSourceId}/resync?workspaceId=${workspaceId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dataSourcesKey(workspaceId) }),
  });
}
