"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  closeJob,
  getJob,
  listApplications,
  rankCandidates,
  Job,
  Application,
  getCvViewUrl,
} from "@/lib/api";

function StatusBadge({ status }: { status: Application["processing_status"] }) {
  const cls =
    status === "embedded"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "ranked"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : status === "failed"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`px-2 py-1 text-xs border rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export default function HrJobManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);

  const [filter, setFilter] = useState<"all" | "embedded" | "failed">("all");

  useEffect(() => {
    const refresh = async () => {
      setMsg(null);
      setLoading(true);
      try {
        const j = await getJob(jobId);
        const a = await listApplications(jobId);
        setJob(j);
        setApps(a);
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    refresh();
  }, [jobId]);

  const refresh = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const j = await getJob(jobId);
      const a = await listApplications(jobId);
      setJob(j);
      setApps(a);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // ✅ After closing -> redirect to /hr dashboard
  async function onClose() {
    setMsg(null);
    try {
      await closeJob(jobId);
      router.push("/hr");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function onRank() {
    setRanking(true);
    setMsg(null);
    try {
      const run = await rankCandidates(jobId);
      setMsg(`✅ Ranking done. Run: ${run.run_id}`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRanking(false);
      // Refresh data after ranking
      setMsg(null);
      setLoading(true);
      try {
        const j = await getJob(jobId);
        const a = await listApplications(jobId);
        setJob(j);
        setApps(a);
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
  }

  const filteredApps = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => a.processing_status === filter);
  }, [apps, filter]);

  const stats = useMemo(() => {
    const total = apps.length;
    const embedded = apps.filter((a) => a.processing_status === "embedded").length;
    const failed = apps.filter((a) => a.processing_status === "failed").length;
    const ranked = apps.filter((a) => a.processing_status === "ranked").length;
    return { total, embedded, failed, ranked };
  }, [apps]);

  if (loading) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;
  if (!job) return <main className="max-w-5xl mx-auto p-6">Job not found.</main>;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">HR — Manage Job</h1>
          <div className="text-sm text-gray-600 mt-1">
            {job.title} • Status: <span className="font-medium">{job.status}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total: {stats.total} • Embedded: {stats.embedded} • Ranked: {stats.ranked} • Failed: {stats.failed}
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            href={`/hr/jobs/${jobId}/results`}
          >
            View Results
          </Link>
        </div>
      </div>

      {msg && <div className="mt-4 text-sm">{msg}</div>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onClose}
          disabled={job.status === "closed"}
          className="px-4 py-2 rounded-lg border text-sm disabled:opacity-60"
        >
          Close Applications
        </button>

        <button
          onClick={onRank}
          disabled={ranking}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
        >
          {ranking ? "Ranking..." : "Rank Candidates"}
        </button>

        <button
          onClick={refresh}
          className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Refresh
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-lg border text-sm ${
              filter === "all" ? "bg-black text-white" : "hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("embedded")}
            className={`px-3 py-2 rounded-lg border text-sm ${
              filter === "embedded" ? "bg-black text-white" : "hover:bg-gray-50"
            }`}
          >
            Embedded
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-3 py-2 rounded-lg border text-sm ${
              filter === "failed" ? "bg-black text-white" : "hover:bg-gray-50"
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-medium">Applicants</h2>

      <div className="mt-4 space-y-4">
        {filteredApps.length === 0 ? (
          <div className="p-6 border rounded-2xl text-sm text-gray-600">
            No applicants for this filter.
          </div>
        ) : (
          filteredApps.map((a) => (
            <div key={a.id} className="p-6 border rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{a.candidate_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {a.candidate_email ?? "—"} • {a.cv_file_type.toUpperCase()}
                  </div>

                  <div className="mt-2">
                    <StatusBadge status={a.processing_status} />
                  </div>

                  {a.processing_status === "failed" && (
                    <div className="text-sm text-red-600 mt-3">
                      {a.error_message}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  <div>{new Date(a.submitted_at).toLocaleString()}</div>
                  <a
                    href={getCvViewUrl(a.cv_file_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50"
                  >
                    View CV
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
