import { forwardRef } from "react";

import { getRiskColor, getRiskLabel } from "../utils/risk";

const ScanResultCard = forwardRef(function ScanResultCard({ scan }, ref) {
  if (!scan) return null;

  return (
    <div ref={ref} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Analysis Report</h3>
        <span className={`text-sm font-bold ${getRiskColor(scan.scamScore)}`}>
          {getRiskLabel(scan.scamScore)} Risk ({scan.scamScore}%)
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
          <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{scan.category}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Input Type</p>
          <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{scan.inputType}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
          <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{scan.confidence || 0}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Verdict</p>
          <p className="mt-1 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">{scan.verdict || "suspicious"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Provider</p>
          <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{scan.providerUsed || "heuristic-engine"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Context Type</p>
          <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{scan.contextType || "general"}</p>
        </div>
      </div>

      {scan.analysisSummary ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Summary</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{scan.analysisSummary}</p>
        </div>
      ) : null}

      {scan.analyzedUrl ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-500">Analyzed URL</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-100">{scan.analyzedUrl}</p>
          {scan.analyzedUrlTitle ? (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Title: {scan.analyzedUrlTitle}</p>
          ) : null}
          {scan.analyzedUrlWarning ? (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Warning: {scan.analyzedUrlWarning}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Explanation</p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{scan.explanation}</p>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Recommended Action</p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{scan.recommendedAction}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Red Flags</p>
          {scan.redFlags?.length ? (
            <ul className="mt-1 space-y-1 text-sm text-rose-700 dark:text-rose-300">
              {scan.redFlags.map((flag, index) => (
                <li key={`${flag}-${index}`}>• {flag}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No major red flags detected.</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Green Flags</p>
          {scan.greenFlags?.length ? (
            <ul className="mt-1 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
              {scan.greenFlags.map((flag, index) => (
                <li key={`${flag}-${index}`}>• {flag}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No trust signals identified yet.</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default ScanResultCard;
