"use client";

import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { FacebookIcon, GithubIcon, Loader2, XIcon } from "lucide-react";

// import {
//   IconBrandGithub,
//   IconBrandGoogle,
//   IconBrandFacebook,
// } from "@tabler/icons-react";

type Provider = "github" | "google" | "facebook" | "discord";

const PROVIDERS: Record<Provider, { label: string; icon: React.ElementType }> =
  {
    // github: { label: "Github", icon: IconBrandGithub },
    // google: { label: "Google", icon: IconBrandGoogle },
    // facebook: { label: "Facebook", icon: IconBrandFacebook },
    github: { label: "Github", icon: GithubIcon },
    google: { label: "Google", icon: XIcon },
    facebook: { label: "Facebook", icon: FacebookIcon },
    discord: { label: "Discord", icon: XIcon },
  };

async function signInWithProvider(
  provider: Provider,
  callbackURL = "/dashboard",
) {
  try {
    return await authClient.signIn.social({ provider, callbackURL });
  } catch (err) {
    console.error(`${provider} login error:`, err);
  }
}

function ProviderLogin({
  provider,
  callbackURL = "/dashboard",
}: {
  provider: Provider;
  callbackURL?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const { label, icon: Icon } = PROVIDERS[provider];

  const handleLogin = () => {
    startTransition(async () => {
      try {
        const response = await signInWithProvider(provider, callbackURL);
        if (response?.data?.redirect && response?.data?.url) {
          window.location.href = response.data.url;
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Button
      disabled={isPending}
      onClick={handleLogin}
      className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-white px-4 font-medium text-black hover:bg-gray-50 dark:bg-gray-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)] dark:hover:bg-gray-800"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-neutral-800 dark:text-neutral-300" />
      ) : (
        <Icon className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
      )}
      <span className="text-sm text-neutral-700 dark:text-neutral-300">
        {isPending ? "Redirecting..." : label}
      </span>
      <BottomGradient />
    </Button>
  );
}

function SocialLogin({ callbackURL = "/dashboard" }) {
  return (
    <div className="flex flex-col space-y-4">
      <ProviderLogin provider="github" callbackURL={callbackURL} />
      <ProviderLogin provider="google" callbackURL={callbackURL} />
      <ProviderLogin provider="facebook" callbackURL={callbackURL} />
      <ProviderLogin provider="discord" callbackURL={callbackURL} />
    </div>
  );
}

export { ProviderLogin };
export default SocialLogin;

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);
