"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, Job } from "@/lib/api";

export default function HrPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jd, setJd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [postedJob, setPostedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  function validateDraft() {
    if (title.trim().length < 3) return "Title too short.";
    if (jd.trim().length < 50) return "JD text too short (min 50 chars).";
    return null;
  }

  function onSubmitForReview() {
    setMsg(null);
    setPostedJob(null);

    const err = validateDraft();
    if (err) {
      setMsg(err);
      return;
    }

    setReviewing(true);
  }

  function onEditDraft() {
    setMsg(null);
    setReviewing(false);
  }

  function onDeleteDraft() {
    setTitle("");
    setCompany("");
    setLocation("");
    setJd("");
    setPostedJob(null);
    setReviewing(false);
    setMsg("Draft deleted.");
  }

  async function onConfirmPost() {
    setMsg(null);
    setPostedJob(null);

    const err = validateDraft();
    if (err) {
      setMsg(err);
      return;
    }

    setLoading(true);
    try {
      const job = await createJob({ title, jd_text: jd, company, location });
      setPostedJob(job);
      setReviewing(false);
      setMsg("Job posted successfully.");
      router.push("/hr");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">HR - Post a Job</h1>
      <p className="text-sm text-gray-600 mt-1">
        Demo HR page (auth will be added later).
      </p>

      {msg && <div className="mt-4 text-sm">{msg}</div>}

      {!reviewing ? (
        <div className="mt-6 grid gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="border rounded-lg p-2"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="border rounded-lg p-2"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <textarea
            className="border rounded-lg p-2 h-48"
            placeholder="Paste full Job Description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <button
            onClick={onSubmitForReview}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          >
            {loading ? "Posting..." : "Submit"}
          </button>
        </div>
      ) : (
        <div className="mt-6 border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Confirm Job Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review all details before posting.
            </p>
          </div>

          <div className="grid gap-3 text-sm">
            <div>
              <div className="text-gray-500">Title</div>
              <div className="font-medium">{title}</div>
            </div>
            <div>
              <div className="text-gray-500">Company</div>
              <div>{company.trim() || "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Location</div>
              <div>{location.trim() || "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Job Description</div>
              <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-3">
                {jd}
              </pre>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onEditDraft}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDeleteDraft}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onConfirmPost}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {loading ? "Posting..." : "Confirm & Post"}
            </button>
          </div>
        </div>
      )}

      {postedJob && (
        <div className="mt-6 border rounded-2xl p-5 space-y-3">
          <div className="font-medium">Posted Job Details</div>
          <div className="text-sm">
            <span className="text-gray-500">Title:</span> {postedJob.title}
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Company:</span>{" "}
            {postedJob.company ?? "-"}
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Location:</span>{" "}
            {postedJob.location ?? "-"}
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Status:</span> {postedJob.status}
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Posted At:</span>{" "}
            {new Date(postedJob.created_at).toLocaleString()}
          </div>
          <div className="text-sm">
            <div className="text-gray-500 mb-2">Job Description</div>
            <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-3">
              {postedJob.jd_text}
            </pre>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              href={`/hr/jobs/${postedJob.id}`}
            >
              Manage Job
            </Link>
            <Link
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              href="/hr"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm">
        Public jobs page:{" "}
        <Link className="underline" href="/jobs">
          /jobs
        </Link>
      </div>
    </main>
  );
}
