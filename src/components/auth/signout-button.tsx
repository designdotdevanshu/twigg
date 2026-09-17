"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { handleLogout } = useAuth();

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => handleLogout()}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-2 rounded-md px-2.5 text-xs font-medium transition-colors"
    >
      <LogOut className="size-3.5" />
      <span>Sign out</span>
    </Button>
  );
}
