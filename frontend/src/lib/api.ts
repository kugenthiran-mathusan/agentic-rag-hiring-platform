import { parseApiError } from "@/lib/errors";

const BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE is not set");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export type Job = {
  id: string;
  title: string;
  jd_text: string;
  company?: string | null;
  location?: string | null;
  status: "open" | "closed";
  created_at: string;
  closed_at?: string | null;
};

export type Application = {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email?: string | null;
  cv_file_url: string;
  cv_file_type: "pdf" | "docx";
  processing_status: "submitted" | "parsed" | "embedded" | "ranked" | "failed";
  submitted_at: string;
  error_message?: string | null;
};

export function getCvViewUrl(cvFileUrl: string): string {
  if (/^https?:\/\//i.test(cvFileUrl)) return cvFileUrl;

  let normalized = cvFileUrl.replace(/\\/g, "/");
  normalized = normalized.replace(/^\.\//, "/");
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;

  return `${BASE}${normalized}`;
}

export async function getJobs() {
  return request<Job[]>("/jobs");
}

export async function getJob(id: string) {
  return request<Job>(`/jobs/${id}`);
}

export async function createJob(payload: {
  title: string;
  jd_text: string;
  company?: string;
  location?: string;
}) {
  return request<Job>("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


export async function applyToJob(
  jobId: string,
  form: { candidate_name: string; candidate_email?: string; candidate_phone?: string },
  file: File
) {
  const fd = new FormData();
  fd.append("candidate_name", form.candidate_name);
  if (form.candidate_email) fd.append("candidate_email", form.candidate_email);
  if (form.candidate_phone) fd.append("candidate_phone", form.candidate_phone);
  fd.append("cv", file);

  const res = await fetch(`${BASE}/jobs/${jobId}/apply`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return (await res.json()) as Application;
}


export async function listApplications(jobId: string) {
  return request<Application[]>(`/jobs/${jobId}/applications`);
}

export async function closeJob(jobId: string) {
  return request<{ status: string; job_id: string }>(`/jobs/${jobId}/close`, {
    method: "PATCH",
  });
}

export async function deleteJob(jobId: string) {
  return request<{ status: string; job_id: string }>(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

export type RankRun = {
  job_id: string;
  run_id: string;
  created_at: string;
  results: Array<{
    application_id: string;
    candidate_name: string;
    rank: number;
    total_score: number;
    score_breakdown: { skills: number; experience: number; role_fit: number };
    label: string;
    explanation_bullets: string[];
    strengths?: string[];
    gaps?: string[];
    evidence_used?: Array<{ chunk_index: number; reason: string }>;
  }>;
};

export async function rankCandidates(jobId: string) {
  return request<RankRun>(`/jobs/${jobId}/rank`, { method: "POST" });
}

export async function getLatestRanking(jobId: string) {
  return request<RankRun>(`/jobs/${jobId}/ranking/latest`);
}

export async function getHrJobs() {
  return request<Job[]>("/jobs/hr/jobs");
}
