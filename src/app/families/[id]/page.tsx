import { getServerSession } from "next-auth";
import { authOptions } from "@server/auth/options";
import FamilyContainer from "@containers/family";

function parseId(x?: string) {
  const n = Number(x);
  if (!x || Number.isNaN(n)) throw new Error("Invalid id");
  return n;
}

export default async function Page(ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div className="p-6">Please <a className="underline" href="/auth/sign-in">sign in</a>.</div>;
  }
  const { id } = await ctx.params;
  const familyId = parseId(id);
  if (Number.isNaN(familyId)) return <div className="p-6">Invalid family ID.</div>;
  return <FamilyContainer familyId={familyId} />;
}
