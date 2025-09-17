"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import SocialLogin from "@/components/auth/social-login";
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
  name: z
    .string()
    .min(2, "Name is too short")
    .regex(/^[a-zA-Z\s]+$/, "Name must only contain letters and spaces"), // Only letters and spaces
  email: z
    .string()
    .email("Invalid email format")
    .min(6, "Email is too short")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email domain format",
    ), // More domain specificity
  password: z
    .string()
    .min(8, "Password is too short")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter") // Uppercase letter
    .regex(/[a-z]/, "Password must contain at least one lowercase letter") // Lowercase letter
    .regex(/[0-9]/, "Password must contain at least one digit") // Number
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ), // Special character
});

type SignUpType = z.infer<typeof schema>;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  USER_EXISTS:
    "An account with this email already exists. Please sign in instead.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Please sign in instead.",
  WEAK_PASSWORD: "Password is too weak. Please choose a stronger password.",
  INVALID_EMAIL: "Please enter a valid email address.",
};

function getAuthErrorMessage(error: { code?: string; message?: string }) {
  return (
    AUTH_ERROR_MESSAGES[error.code ?? ""] ??
    error.message ??
    "An unexpected error occurred. Please try again."
  );
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const form = useForm<SignUpType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (payload: SignUpType) => {
    await signUp.email({
      ...payload,
      callbackURL: "/dashboard",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Welcome to Twigg!");
        },
        onError: ({ error }) => {
          const message = getAuthErrorMessage(error);
          form.setError("root", { type: "manual", message });
          toast.error(message);
        },
      },
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Sign up to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to sign up to your account
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="name">Full Name</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    type="name"
                    autoComplete="name"
                    placeholder="Tyler Durden"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="password">Password</FormLabel>
                </div>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AuthButton type="Sign up" formState={form.formState} />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
          <SocialLogin />
        </div>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
