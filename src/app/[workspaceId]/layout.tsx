import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getUserWorkspaces } from "@/actions/workspace";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ContentHeader } from "@/components/layout/content-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { OnboardingModal } from "@/components/onboarding-modal";

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
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
        className="h-svh overflow-hidden"
      >
        {/* Single AppSidebar */}
        <AppSidebar user={session.user} />

        {/* Fixed Application Shell */}
        <SidebarInset className="bg-background flex h-svh w-full flex-1 flex-col overflow-hidden">
          {/* Fixed Desktop Header */}
          <ContentHeader />

          {/* Fixed Mobile Top Bar */}
          <MobileHeader />

          {/* Main workspace content: The ONLY scrollable region */}
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav user={session.user} />
        </SidebarInset>
      </SidebarProvider>

      <OnboardingModal userId={session.user.id} />
    </WorkspaceProvider>
  );
}
