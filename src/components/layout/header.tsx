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
import { LayoutDashboard, PenBox } from "lucide-react";

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  const SignedIn = ({ children }: { children: React.ReactNode }) => {
    return user ? children : null;
  };

  const SignedOut = ({ children }: { children: React.ReactNode }) => {
    return user ? null : children;
  };

  const SignInButton = ({ children }: { children: React.ReactNode }) => {
    return user ? null : <Link href="/signin">{children}</Link>;
  };

  const UserButton = () => {
    return user ? (
      <Avatar className="h-10 w-10">
        <AvatarImage src={user?.image ?? ""} />
        <AvatarFallback className="bg-blue-500 text-sm text-white">
          {user?.name?.[0]}
        </AvatarFallback>
      </Avatar>
    ) : null;
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/">
          <h1 className="cursor-pointer text-3xl font-bold">Twigg</h1>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Button variant="outline">
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
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Popover>
              <PopoverTrigger
                title="Account settings"
                className="active:scale-95"
              >
                <UserButton />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-96 border border-gray-200 p-0 shadow-lg"
              >
                {/* User Info Section - Clerk Style */}
                <div className="flex items-center gap-3 border-b border-gray-200 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.image ?? ""} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {user?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user?.name ?? "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email ?? "user@example.com"}
                    </p>
                  </div>
                </div>

                <LogoutButton />
              </PopoverContent>
            </Popover>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
