"use client";

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            window.location.href = "/signin";
          },
          onError: () => {
            toast.error("Failed to sign out. Please try again.");
          },
        },
      });
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return { handleLogout };
}
