"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import type { Workspace } from "@prisma/client";

interface WorkspaceContextValue {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  isPersonal: boolean;
  isBusiness: boolean;
  switchWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  currentWorkspace,
  workspaces,
  children,
}: {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  children: React.ReactNode;
}) {
  const router = useRouter();

  const switchWorkspace = (workspaceId: string) => {
    router.push(`/${workspaceId}/dashboard`);
  };

  const isPersonal = currentWorkspace.type === "PERSONAL";
  const isBusiness = currentWorkspace.type === "BUSINESS";

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        isPersonal,
        isBusiness,
        switchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
