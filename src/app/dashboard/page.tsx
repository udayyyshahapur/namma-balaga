import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return <div className="p-6">Please <a className="underline" href="/auth/sign-in">sign in</a>.</div>;
    return <div className="p-6">Signed in as <b>{session.user?.email}</b></div>;
}


