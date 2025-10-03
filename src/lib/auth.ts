import { headers } from "next/headers";
import { auth } from "@/server/auth";

export async function getUserSession() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("No active session");

    return session.user;
  } catch (error) {
    console.error("Error getting user session:", error);
    throw error;
  }
}
