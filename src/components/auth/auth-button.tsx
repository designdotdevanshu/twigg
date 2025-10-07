import * as React from "react";
import type { FieldValues, FormState } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const loadingText = (
  type: "Sign in" | "Sign up" | "Reset Password" | "Send Reset Link",
) => {
  const OBJ = {
    "Sign in": "Signing in...",
    "Sign up": "Signing up...",
    "Reset Password": "Resetting password...",
    "Send Reset Link": "Sending link...",
    "Request New Link": "Requesting link...",
  };

  return OBJ[type];
};

const BottomGradient = React.forwardRef<HTMLSpanElement>((_, ref) => (
  <>
    <span
      ref={ref}
      className={cn(
        "absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100",
      )}
    />
    <span
      ref={ref}
      className={cn(
        "absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100",
      )}
    />
  </>
));
BottomGradient.displayName = "BottomGradient";

const AuthButton = React.forwardRef<
  HTMLButtonElement,
  {
    type?: "Sign in" | "Sign up" | "Reset Password" | "Send Reset Link";
    formState?: FormState<FieldValues>;
    children?: React.ReactNode;
  }
>(({ type, formState, children }, ref) => (
  <Button
    ref={ref}
    type={children ? "button" : "submit"}
    disabled={formState?.isSubmitting}
    className={cn(
      "group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]",
    )}
  >
    {type && (
      <>
        {formState?.isSubmitting ? (
          <p className={cn("flex items-center justify-center gap-x-2")}>
            <Spinner /> {loadingText(type)}
          </p>
        ) : (
          <>{type} &rarr;</>
        )}
      </>
    )}
    {children}
    <BottomGradient />
  </Button>
));
AuthButton.displayName = "AuthButton";

export { AuthButton, BottomGradient };
