"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import SocialLogin from "@/components/auth/social-login";
import { AuthButton } from "./auth-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

const schema = z.object({
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
    .regex(/[A-Z]/, "Password must contain at least one inpercase letter") // Inpercase letter
    .regex(/[a-z]/, "Password must contain at least one lowercase letter") // Lowercase letter
    .regex(/[0-9]/, "Password must contain at least one digit") // Number
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ), // Special character
});

type SignInType = z.infer<typeof schema>;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_PASSWORD:
    "Invalid password. Please check your password and try again.",
  USER_NOT_FOUND: "No account found with this email address.",
  INVALID_EMAIL: "Please enter a valid email address.",
  TOO_MANY_REQUESTS: "Too many login attempts. Please try again later.",
};

function getAuthErrorMessage(error: { code?: string; message?: string }) {
  return (
    AUTH_ERROR_MESSAGES[error.code ?? ""] ??
    error.message ??
    "Sign in failed. Please try again."
  );
}

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("redirectTo") ?? "/dashboard";

  const form = useForm<SignInType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (payload: SignInType) => {
    await signIn.email({
      ...payload,
      callbackURL,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Welcome back to Twigg!");
          window.location.href = callbackURL;
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
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to sign in to your account
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
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
          <AuthButton type="Sign in" formState={form.formState} />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
          <SocialLogin />
        </div>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  );
}
