"use client";

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast("You have been signed out.");
          window.location.href = "/signin";
        },
      },
    });
  };

  return { handleLogout };
}
