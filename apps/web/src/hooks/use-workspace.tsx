import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-auth";
import type { Workspace } from "@/lib/api-types";

interface WorkspaceContextValue {
  workspace: Workspace | undefined;
  workspaces: Workspace[];
  selectWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data } = useCurrentUser();
  const [selectedId, setSelectedId] = useState<string>();

  const workspaces = data?.workspaces ?? [];
  const workspace = workspaces.find((w) => w.id === selectedId) ?? workspaces[0];

  const value = useMemo(
    () => ({ workspace, workspaces, selectWorkspace: setSelectedId }),
    [workspace, workspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  return context;
}
