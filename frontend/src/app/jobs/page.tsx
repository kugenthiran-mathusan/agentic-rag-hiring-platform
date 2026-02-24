"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobs, Job } from "@/lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getJobs();
        setJobs(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = jobs.filter((j) =>
    `${j.title} ${j.company ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Open Jobs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload your CV and apply directly.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>

      {loading ? (
        <div className="mt-8">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 p-6 border rounded-xl text-center text-sm text-gray-600">
          No jobs found.
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {filtered.map((j) => (
            <div
              key={j.id}
              className="p-6 border rounded-2xl hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">{j.title}</h2>
                  <div className="text-sm text-gray-600 mt-1">
                    {j.company ?? "—"} • {j.location ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Posted on {new Date(j.created_at).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  href={`/jobs/${j.id}`}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  View & Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}