export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SettingsManager } from "@/components/settings/settings-manager";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          App Settings & Preferences
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Manage your personal profile, preferred currency, visual appearance,
          and workspace configurations.
        </p>
      </div>

      <SettingsManager user={session.user} />
    </div>
  );
}
