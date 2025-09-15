import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuth, type User } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter, type PrismaConfig } from "better-auth/adapters/prisma";
import { sendResetEmail } from "./send-reset-email";

const provider = "postgresql" as PrismaConfig["provider"];

export const auth = betterAuth({
  database: prismaAdapter(db, { provider }),
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    autoSignIn: false,
    async sendResetPassword({
      user,
      url,
    }: {
      user: User;
      url: string;
    }): Promise<void> {
      try {
        await sendResetEmail(user, url);
      } catch (error) {
        console.error("Password reset email failed:", error);
        throw new Error("Failed to send reset email. Please try again.");
      }
    },
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },
  plugins: [nextCookies()],
});
