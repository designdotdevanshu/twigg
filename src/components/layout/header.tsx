import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/signout-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LayoutDashboard, PenBox, Settings2Icon } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  const UserAvatar = () =>
    user ? (
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image ?? ""} />
        <AvatarFallback className="bg-blue-500 text-white">
          {user.name?.[0]}
        </AvatarFallback>
      </Avatar>
    ) : null;

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/">
          <h1 className="text-gradient-primary cursor-pointer text-3xl font-bold">
            Twigg
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <LayoutDashboard size={18} />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/transaction/create">
                <Button className="flex items-center gap-2">
                  <PenBox size={18} />
                  <span className="hidden md:inline">Add Transaction</span>
                </Button>
              </Link>
            </>
          )}

          {!user && (
            <Link href="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}

          {user && (
            <Popover>
              <PopoverTrigger className="active:scale-95">
                <UserAvatar />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-80 border border-gray-200 p-0 shadow-lg dark:border-gray-700"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
                  <UserAvatar />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name ?? "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email ?? "user@example.com"}
                    </p>
                  </div>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Manage Account */}
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 w-full items-center justify-start gap-5 rounded-none border-b border-gray-200 p-4 px-8 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <Settings2Icon className="h-2 w-2 text-gray-600 dark:text-gray-300" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Manage Account
                  </span>
                </Button>

                {/* Logout */}
                <LogoutButton />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </nav>
    </header>
  );
}
