import Link from "next/link";

export default function NavBar() {
  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Agentic RAG Hiring
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link className="hover:underline" href="/jobs">Jobs</Link>
          <Link className="hover:underline" href="/hr">HR</Link>
        </nav>
      </div>
    </header>
  );
}