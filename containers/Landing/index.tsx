import Link from "next/link";
import { Card, CardTitle } from "@components/Card";

export default function LandingContainer() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Nav */}
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Namma Balaga
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="px-4 py-2 rounded-md border hover:bg-black/5 transition"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 transition"
          >
            Create account
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
            Your family,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              beautifully connected
            </span>
            .
          </h1>
          <p className="mt-4 text-slate-600 text-lg">
            Build a private family space: a living family tree, stories that never
            get lost, and a place where every generation can find their roots.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="px-5 py-3 rounded-md bg-black text-white hover:bg-black/90 transition"
            >
              Get started — it’s free
            </Link>
            <Link
              href="/auth/sign-in"
              className="px-5 py-3 rounded-md border hover:bg-black/5 transition"
            >
              I already have an account
            </Link>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Private by default • Invite-only • You control who can edit
          </p>
        </div>

        {/* Pretty card stack */}
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-blue-200/60 to-indigo-200/40 blur-2xl" />
          <div className="grid gap-4">
            <Card className="p-5">
              <CardTitle>Living Family Tree</CardTitle>
              <p className="text-slate-600">
                Add parents, siblings, spouses, and children with approvals to keep
                the tree accurate.
              </p>
            </Card>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <CardTitle className="text-lg">Stories that stay</CardTitle>
                <p className="text-slate-600">
                  Capture memories and link them to the people in them.
                </p>
              </Card>
              <Card className="p-5">
                <CardTitle className="text-lg">Invite-only privacy</CardTitle>
                <p className="text-slate-600">
                  Each family has its own private space with join codes.
                </p>
              </Card>
            </div>
            <Card className="p-5">
              <CardTitle>Approvals & Stewardship</CardTitle>
              <p className="text-slate-600">
                Changes are proposed and approved by trusted members.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Namma Balaga</span>
          <div className="flex gap-4">
            <a className="hover:underline" href="/auth/sign-up">Create account</a>
            <a className="hover:underline" href="/auth/sign-in">Sign in</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
