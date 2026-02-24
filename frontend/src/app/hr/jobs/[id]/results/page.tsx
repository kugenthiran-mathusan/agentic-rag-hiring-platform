"use client";

import { useEffect, useState } from "react";
import { getLatestRanking, listApplications, getCvViewUrl, Application } from "@/lib/api";
import { useParams } from "next/navigation";

export default function HrResultsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  type RankingData = {
    run_id: string;
    prompt_version?: string;
    model?: string;
    results: Array<{
      application_id: string;
      rank: number;
      candidate_name: string;
      label: string;
      total_score: number;
      score_breakdown: {
        skills: number;
        experience: number;
        role_fit: number;
      };
      explanation_bullets: string[];
    }>;
  };

  const [data, setData] = useState<RankingData | null>(null);
  const [applicationsById, setApplicationsById] = useState<Record<string, Application>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, apps] = await Promise.all([
          getLatestRanking(jobId),
          listApplications(jobId),
        ]);
        setData(d as RankingData);
        setApplicationsById(
          Object.fromEntries((apps || []).map((a) => [a.id, a]))
        );
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : "An error occurred");
      }
    })();
  }, [jobId]);

  if (msg) return <main className="max-w-4xl mx-auto p-6">{msg}</main>;
  if (!data) return <main className="max-w-4xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Ranking Results</h1>
      <div className="text-sm text-gray-600 mt-1">
        Run: <span className="font-medium">{data.run_id}</span> • Prompt: {data.prompt_version} • Model: {data.model}
      </div>

      <div className="mt-6 space-y-4">
        {(data.results || []).map((r: RankingData['results'][number]) => (
          <div key={r.application_id} className="p-4 border rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">
                  #{r.rank} — {r.candidate_name} ({r.label})
                </div>
                <div className="text-sm text-gray-600">
                  Total: {r.total_score} • Skills: {r.score_breakdown?.skills} • Exp: {r.score_breakdown?.experience} • Fit: {r.score_breakdown?.role_fit}
                </div>
              </div>
              {applicationsById[r.application_id] && (
                <a
                  href={getCvViewUrl(applicationsById[r.application_id].cv_file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  View CV
                </a>
              )}
            </div>

            <ul className="mt-3 list-disc pl-6 text-sm">
              {(r.explanation_bullets || []).map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
