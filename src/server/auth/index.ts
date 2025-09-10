import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "./config";

export { auth };
export const handlers = toNextJsHandler(auth);
