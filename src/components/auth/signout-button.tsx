"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { handleLogout } = useAuth();

  return (
    <Button
      size="lg"
      variant="ghost"
      onClick={handleLogout}
      className="h-14 w-full items-center justify-start gap-5 rounded-none border-b border-gray-200 p-4 px-8 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      <LogOutIcon className="h-2 w-2 text-gray-600 dark:text-gray-300" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Sign out
      </span>
    </Button>
  );
}
