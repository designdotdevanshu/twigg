import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getUserWorkspaces } from "@/actions/workspace";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin");
  }

  const workspaces = await getUserWorkspaces();
  const activeWs = workspaces.find((w) => w.isDefault) ?? workspaces[0];

  if (activeWs) {
    redirect(`/${activeWs.id}/dashboard`);
  }

  redirect("/signin");
}
