"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthButton } from "./auth-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password is too short")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordType = z.infer<typeof schema>;

const RESET_PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:
    "Invalid or expired reset token. Please request a new password reset.",
  TOKEN_EXPIRED:
    "Reset token has expired. Please request a new password reset.",
  WEAK_PASSWORD: "Password doesn't meet security requirements.",
  USER_NOT_FOUND: "No account found. Please request a new password reset.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
};

function getResetPasswordErrorMessage(error: {
  code?: string;
  message?: string;
}) {
  return (
    RESET_PASSWORD_ERROR_MESSAGES[error.code ?? ""] ??
    error.message ??
    "Failed to reset password. Please try again."
  );
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();

  const form = useForm<ResetPasswordType>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async ({ newPassword }: ResetPasswordType) => {
    try {
      const { error } = await authClient.resetPassword({ token, newPassword });

      if (error) {
        if (error.code === "INVALID_TOKEN" || error.code === "TOKEN_EXPIRED") {
          router.replace("/reset-password");
        }
        const message = getResetPasswordErrorMessage(error);
        form.setError("root", { type: "manual", message });
        toast.error(message);
      } else {
        toast.success(
          "Password updated successfully! Please sign in with your new password.",
        );
        router.push("/signin");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      const message = "An unexpected error occurred. Please try again.";
      form.setError("root", { type: "manual", message });
      toast.error(message);
    }
  };

  if (!token) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn("flex flex-col gap-6", className)}
          {...props}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
            <p className="text-destructive text-sm text-balance">
              The reset link is invalid or has expired. Please request a new
              password reset.
            </p>
          </div>
          <div className="grid gap-6">
            <Link href="/forgot-password">
              <AuthButton>Request New Link</AuthButton>
            </Link>
          </div>
          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link href="/signin" className="underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </form>
      </Form>
    );
  }

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
            name="newPassword"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="newPassword">New Password</FormLabel>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    id="newPassword"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="confirmPassword">
                    Confirm Password
                  </FormLabel>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    id="confirmPassword"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AuthButton type="Reset Password" formState={form.formState} />
        </div>
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
