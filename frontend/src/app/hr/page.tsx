"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deleteJob, getHrJobs, Job } from "@/lib/api";

export default function HrDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // HR dashboard endpoint includes both open and closed jobs.
        const data = await getHrJobs();
        setJobs(data);
      } catch (e: Error | unknown) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = jobs.length;
    const open = jobs.filter((j) => j.status === "open").length;
    return { total, open };
  }, [jobs]);

  async function handleDeleteJob(job: Job) {
    if (job.status !== "closed") return;

    const confirmed = window.confirm(
      `Delete closed job "${job.title}"? This also removes its applications and ranking results.`
    );
    if (!confirmed) return;

    setMsg(null);
    setDeletingId(job.id);
    try {
      await deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (e: Error | unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">HR Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Post jobs, manage applicants, and rank candidates.
          </p>
        </div>

        <Link
          href="/hr/post"
          className="px-4 py-2 rounded-lg bg-black text-white text-sm"
        >
          + Post a Job
        </Link>
      </div>

      {msg && <div className="mt-4 text-sm text-red-600">{msg}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="p-6 border rounded-2xl">
          <div className="text-sm text-gray-600">Open Jobs</div>
          <div className="text-3xl font-semibold mt-2">{stats.open}</div>
        </div>
        <div className="p-6 border rounded-2xl">
          <div className="text-sm text-gray-600">Jobs Visible (Demo)</div>
          <div className="text-3xl font-semibold mt-2">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-2">
            *Currently shows only open jobs because we reuse <code>/jobs</code>.
            We’ll add HR view for closed jobs in Step F6.5.
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-medium">Jobs</h2>

      {loading ? (
        <div className="mt-4">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="mt-4 p-6 border rounded-2xl text-sm text-gray-600">
          No jobs yet. Click “Post a Job”.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {jobs.map((j) => (
            <div key={j.id} className="p-6 border rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {j.title}
                    <span
                       className={`px-2 py-1 text-xs rounded-full border ${
                        j.status === "open"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                     }`}
                    >
                        {j.status}
                    </span>
                    </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {j.company ?? "—"} • {j.location ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Posted on {new Date(j.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/hr/jobs/${j.id}`}
                    className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    Manage
                  </Link>
                  {j.status === "closed" && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteJob(j)}
                      disabled={deletingId === j.id}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deletingId === j.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
