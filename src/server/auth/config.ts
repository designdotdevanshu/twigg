import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "@/env";

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
