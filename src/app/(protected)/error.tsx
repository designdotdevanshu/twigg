"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; // assuming you have a Button component

interface ErrorProps {
  error: Error & { digest?: string };
}

/**
 * Global route-level error boundary.
 * Displays a user-friendly alert while logging detailed error info in dev.
 */
export default function Error({ error }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.group("💥 Route Error Boundary");
      console.error("Message:", error.message);
      if (error.digest) console.error("Digest:", error.digest);
      console.error("Stack:", error.stack);
      console.groupEnd();
    } else {
      console.error("Error in protected route:", {
        message: error.message,
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <div className="flex flex-col">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {error.message ||
                "We hit an unexpected error. You can try again or return home."}
            </AlertDescription>
          </div>
        </Alert>

        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
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
