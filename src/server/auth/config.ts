import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "@/env";

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface EmailResult {
  data?: {
    id: string;
  } | null;
  error?: string;
}

interface EmailLogData {
  userEmail: string;
  userId?: string;
  timestamp: string;
  emailId?: string;
  attempt?: number;
  error?: string;
  stack?: string;
  totalAttempts?: number;
  finalError?: string;
  userAgent?: string;
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    autoSignIn: false,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID as string,
      clientSecret: env.FACEBOOK_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

export type { User, EmailResult, EmailLogData };
