"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

export function LogoutButton() {
  const { handleLogout } = useAuth();

  return (
    <Button
      size="lg"
      variant="ghost"
      onClick={handleLogout}
      className="h-14 w-full items-center justify-start gap-5 rounded-none border-b border-gray-200 p-4 px-8 text-xs font-medium hover:bg-gray-100"
    >
      <LogOutIcon className="h-2 w-2 text-gray-600" />
      <span className="ttext-xs font-medium text-gray-700">Sign out</span>
    </Button>
  );
}
