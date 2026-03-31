import { useEffect, useState } from "react";

import api from "../services/api";
import StatCard from "../components/StatCard";
import Loader from "../components/Loader";

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/scan/history");
        setHistory(response.data.scans);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const highRiskCount = history.filter((item) => item.scamScore >= 75).length;
  const avgRisk = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.scamScore, 0) / history.length)
    : 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Security Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Track your scan activity and threat exposure.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Scans" value={history.length} />
        <StatCard title="High Risk Alerts" value={highRiskCount} tone="danger" />
        <StatCard title="Average Risk Score" value={`${avgRisk}%`} tone="warning" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        {loading ? (
          <div className="mt-4">
            <Loader text="Loading recent scans" />
          </div>
        ) : history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No scans yet. Start by scanning a suspicious message.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.slice(0, 8).map((scan) => (
              <li key={scan._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold capitalize">{scan.category}</p>
                  <p className="text-sm font-bold">{scan.scamScore}%</p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{scan.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
