import { Suspense } from "react";
import { SigninForm } from "@/components/auth/signin-form";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense
              fallback={
                <div className="text-muted-foreground text-sm">Loading...</div>
              }
            >
              <SigninForm />
            </Suspense>
          </div>
        </div>
      </div>
      <AuthHeroPanel />
    </div>
  );
}
