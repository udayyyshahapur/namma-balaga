import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import DashboardClient from "@containers/dashboard";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    // You liked the redirection UX; keep it direct:
    return <div className="p-6">Please <a className="underline" href="/auth/sign-in">sign in</a>.</div>;
  }
  return <DashboardClient />;
}
