import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getUserWorkspaces } from "@/actions/workspace";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { WorkspaceNav } from "@/components/layout/workspace-nav";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin");
  }

  const workspaces = await getUserWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  if (!currentWorkspace) {
    const fallbackWs = workspaces[0];
    if (fallbackWs) {
      redirect(`/${fallbackWs.id}/dashboard`);
    } else {
      redirect("/signin");
    }
  }

  return (
    <WorkspaceProvider
      currentWorkspace={currentWorkspace}
      workspaces={workspaces}
    >
      <div className="bg-background flex min-h-screen flex-col">
        <WorkspaceNav user={session.user} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
