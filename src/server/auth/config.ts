import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";

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

class ConfigurationError extends Error {
  constructor(missingVars: string[]) {
    super(`Missing required environment variables: ${missingVars.join(", ")}`);
    this.name = "ConfigurationError";
  }
}

const validateEmailConfig = (): void => {
  const requiredEnvVars: string[] = [
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new ConfigurationError(missingVars);
  }
};

// Custom error class for better error handling
class EmailDeliveryError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
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
  plugins: [nextCookies()],
});

// Export types and functions for use in other modules
export type { User, EmailResult, EmailLogData };
export { validateEmailConfig, ConfigurationError, EmailDeliveryError };
