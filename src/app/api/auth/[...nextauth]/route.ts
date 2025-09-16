import NextAuth from "next-auth";
import { authOptions } from "@server/auth/options";

/**
  * Catch-all route that handles:
  * - POST /api/auth/callback/credentials (sign-in)
  * - GET/POST /api/auth/session, /signin, /signout, etc.
  */

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
