import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { MetricDefinition } from "@/lib/api-types";

export function useMetrics(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["metrics", workspaceId],
    queryFn: () => apiRequest<MetricDefinition[]>(`/metrics?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useMetric(workspaceId: string | undefined, metricKey: string | undefined) {
  return useQuery({
    queryKey: ["metric", workspaceId, metricKey],
    queryFn: () => apiRequest<MetricDefinition>(`/metrics/${metricKey}?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId && metricKey),
  });
}
