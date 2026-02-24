import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-semibold">Agentic RAG Hiring Platform</h1>
      <p className="text-gray-600 mt-2">
        HR posts a Job Description. Candidates upload CVs. The system ranks candidates using evidence-based RAG + LLM.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/jobs"
          className="p-6 border rounded-2xl hover:bg-gray-50 transition"
        >
          <div className="text-xl font-medium">I’m a Candidate</div>
          <div className="text-sm text-gray-600 mt-2">
            Browse jobs and apply by uploading your CV (PDF/DOCX).
          </div>
          <div className="mt-4 inline-block text-sm underline">Go to Jobs →</div>
        </Link>

        <Link
          href="/hr"
          className="p-6 border rounded-2xl hover:bg-gray-50 transition"
        >
          <div className="text-xl font-medium">I’m HR</div>
          <div className="text-sm text-gray-600 mt-2">
            Post jobs, view applicants, and rank candidates with explanations.
          </div>
          <div className="mt-4 inline-block text-sm underline">Go to HR Dashboard →</div>
        </Link>
      </div>

      <div className="mt-10 p-6 border rounded-2xl">
        <div className="font-medium">Quick Demo Flow</div>
        <ol className="list-decimal pl-6 mt-3 text-sm text-gray-700 space-y-1">
          <li>HR posts a job in <span className="font-medium">/hr/post</span></li>
          <li>Candidate applies in <span className="font-medium">/jobs</span></li>
          <li>CV is parsed → chunked → embedded into Qdrant</li>
          <li>HR ranks candidates and views results + evidence</li>
        </ol>
      </div>
    </main>
  );
}