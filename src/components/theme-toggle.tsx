"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, SunMoonIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const nextThemeMap: Record<string, { name: string; icon: React.ReactNode }> =
    {
      system: {
        name: "Dark",
        icon: <SunIcon />,
      },
      dark: {
        name: "Light",
        icon: <MoonIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />,
      },
      light: {
        name: "System",
        icon: (
          <SunMoonIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ),
      },
    };

  const nextTheme = () => {
    if (theme === "system") return setTheme("dark");
    if (theme === "dark") return setTheme("light");
    return setTheme("system");
  };

  const next = nextThemeMap[theme ?? "system"];

  return (
    <Button
      size="lg"
      variant="ghost"
      onClick={nextTheme}
      className="h-14 w-full items-center justify-start gap-5 rounded-none border-b border-gray-200 p-4 px-8 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      {next?.icon}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Switch to {next?.name}
      </span>
    </Button>
  );
}
