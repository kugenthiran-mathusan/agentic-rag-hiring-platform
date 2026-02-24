"use client";

import { useEffect, useMemo, useState } from "react";
import { applyToJob, getJob, Job } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const j = await getJob(jobId);
        setJob(j);
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const canSubmit = useMemo(() => {
    if (!job) return false;
    if (job.status !== "open") return false;
    if (!name.trim()) return false;
    if (!file) return false;
    const fn = file.name.toLowerCase();
    if (!(fn.endsWith(".pdf") || fn.endsWith(".docx"))) return false;
    return true;
  }, [job, name, file]);

  async function onSubmit() {
    setMsg(null);
    if (!job) return;

    if (!canSubmit) {
      setMsg("Please enter your name and upload a PDF/DOCX CV.");
      return;
    }

    setSubmitting(true);
    try {
      await applyToJob(
        jobId,
        { candidate_name: name.trim(), candidate_email: email.trim() || undefined, candidate_phone: phone.trim() || undefined },
        file!
      );
      setSuccess(true);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;
  if (!job) return <main className="max-w-5xl mx-auto p-6">Job not found.</main>;

  if (success) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="p-6 border rounded-2xl">
          <h1 className="text-2xl font-semibold">✅ Application Submitted</h1>
          <p className="text-sm text-gray-600 mt-2">
            Your CV was uploaded successfully. The system will process it soon.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => router.push("/jobs")}
            >
              Back to Jobs
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-black text-white"
              onClick={() => router.refresh()}
            >
              Apply Another (Refresh)
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <div className="text-sm text-gray-600 mt-1">
            {job.company ?? "—"} • {job.location ?? "—"} • Status:{" "}
            <span className="font-medium">{job.status}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-6 border rounded-2xl whitespace-pre-wrap text-sm leading-6">
        {job.jd_text}
      </div>

      <div className="mt-8 p-6 border rounded-2xl">
        <h2 className="text-lg font-medium">Apply</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload your CV as a PDF or DOCX file.
        </p>

        {msg && <div className="mt-4 text-sm text-red-600">{msg}</div>}

        <div className="mt-6 grid gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded-lg p-2"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border rounded-lg p-2"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="border rounded-lg p-3">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs text-gray-600 mt-2">
              Selected:{" "}
              <span className="font-medium">
                {file ? file.name : "No file selected"}
              </span>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>

          {job.status !== "open" && (
            <div className="text-sm text-gray-600">
              Applications are closed for this job.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}