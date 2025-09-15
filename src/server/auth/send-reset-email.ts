import { env } from "@/env";
import { Resend } from "resend";
import type { User } from "better-auth";
import { getResetPasswordEmailTemplate } from "./reset-password";

const resend = new Resend(env.RESEND_API_KEY);

// Email delivery with retry logic and proper typing
export const sendResetEmail = async (
  user: User,
  url: string,
  maxRetries = 3,
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const emailTags = [
        { name: "category", value: "password-reset" },
        { name: "environment", value: env.NODE_ENV || "development" },
        { name: "user_id", value: user.id },
      ];

      return await resend.emails.send({
        from: `Twigg <${env.RESEND_FROM_EMAIL}>`,
        to: user.email,
        subject: "Reset Your Twigg Password",
        html: getResetPasswordEmailTemplate(user, url),
        tags: emailTags,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`Email send attempt ${attempt} failed:`, errorStack);

      if (attempt === maxRetries) {
        console.error("All email send attempts failed", errorStack);
        throw new Error(
          `Failed to send reset email after ${maxRetries} attempts: ${errorMessage}`,
        );
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error("Unexpected error in email retry logic");
};
