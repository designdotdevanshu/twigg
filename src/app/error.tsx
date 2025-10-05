"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary UI for the home/root page.
 * Shows a user-friendly alert and logs detailed info in dev.
 */
export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.group("💥 Root Page Error Boundary");
      console.error("Message:", error.message);
      if (error.digest) console.error("Digest:", error.digest);
      console.error("Stack:", error.stack);
      console.groupEnd();
    } else {
      console.error("Error on root page:", {
        message: error.message,
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <div className="flex flex-col">
            <AlertTitle>Oops! Something went wrong</AlertTitle>
            <AlertDescription>
              There was an unexpected error loading the home page. You can try
              reloading or go to another page.
            </AlertDescription>
          </div>
        </Alert>

        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={reset}
            variant="default"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reload
          </Button>

          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go home
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <pre className="mt-6 w-full overflow-x-auto rounded bg-gray-100 p-4 text-sm text-gray-800">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        )}
      </div>
    </main>
  );
}
