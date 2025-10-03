import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.string().url().min(1, "BETTER_AUTH_URL is required"),
    RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
    RESEND_FROM_EMAIL: z
      .string()
      .email("RESEND_FROM_EMAIL must be a valid email")
      .min(1, "RESEND_FROM_EMAIL is required"),
    GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
    GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    FACEBOOK_CLIENT_ID: z.string().min(1, "FACEBOOK_CLIENT_ID is required"),
    FACEBOOK_CLIENT_SECRET: z
      .string()
      .min(1, "FACEBOOK_CLIENT_SECRET is required"),
    DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
    DISCORD_CLIENT_SECRET: z
      .string()
      .min(1, "DISCORD_CLIENT_SECRET is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    GEMINI_MODEL_PRIMARY: z.string().default("gemini-2.0-flash-lite"),
    GEMINI_MODEL_FALLBACK: z.string().default("gemini-2.0-flash"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL_PRIMARY: process.env.GEMINI_MODEL_PRIMARY,
    GEMINI_MODEL_FALLBACK: process.env.GEMINI_MODEL_FALLBACK,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
