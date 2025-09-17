"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { AuthButton } from "./auth-button";

const schema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(6, "Email is too short")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email domain format",
    ),
});

type ForgotPasswordType = z.infer<typeof schema>;

const FORGOT_PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "No account found with this email address.",
  INVALID_EMAIL: "Please enter a valid email address.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  RATE_LIMITED: "Please wait before requesting another reset email.",
};

function getForgotPasswordErrorMessage(error: {
  code?: string;
  message?: string;
}) {
  return (
    FORGOT_PASSWORD_ERROR_MESSAGES[error.code ?? ""] ??
    error.message ??
    "Failed to send reset email. Please try again."
  );
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const form = useForm<ForgotPasswordType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async ({ email }: ForgotPasswordType) => {
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        const message = getForgotPasswordErrorMessage(error);
        form.setError("root", { type: "manual", message });
        toast.error(message);
      } else {
        toast.success(
          "Password reset email sent! Check your inbox and spam folder.",
        );
        form.reset(); // Clear form on success
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      const message = "An unexpected error occurred. Please try again.";
      form.setError("root", { type: "manual", message });
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="project.mayhem@fc.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AuthButton type="Send Reset Link" formState={form.formState} />
        </div>
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </form>

      <div className="text-muted-foreground mt-10 space-y-2 text-xs">
        <p>• Check your spam/junk folder if you don&apos;t see the email</p>
        <p>• The reset link will expire in 1 hour</p>
        <p>• Make sure the email address is correct</p>
      </div>
    </Form>
  );
}
