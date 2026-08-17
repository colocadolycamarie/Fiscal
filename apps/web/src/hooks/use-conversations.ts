import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { AssistantAnswer, Conversation, Message } from "@/lib/api-types";

function conversationsKey(workspaceId: string | undefined) {
  return ["conversations", workspaceId] as const;
}
function messagesKey(conversationId: string | undefined) {
  return ["messages", conversationId] as const;
}

export function useConversations(workspaceId: string | undefined) {
  return useQuery({
    queryKey: conversationsKey(workspaceId),
    queryFn: () => apiRequest<Conversation[]>(`/conversations?workspaceId=${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: messagesKey(conversationId),
    queryFn: () => apiRequest<Message[]>(`/conversations/${conversationId}/messages`),
    enabled: Boolean(conversationId),
  });
}

export function useAskAssistant(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { conversationId?: string; question: string }) =>
      apiRequest<{ conversationId: string; answer: AssistantAnswer }>("/chat", { method: "POST", body: { workspaceId, ...input } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conversationsKey(workspaceId) });
      queryClient.invalidateQueries({ queryKey: messagesKey(data.conversationId) });
    },
  });
}
