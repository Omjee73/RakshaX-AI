import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import Loader from "../components/Loader";
import api from "../services/api";

export default function TrendsPage() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await api.get("/trends/summary?days=30");
        setTrends(response.data.trends);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) return <Loader text="Loading trend analytics" />;
  if (!trends) return <p className="text-sm text-slate-500">No trend data available.</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-extrabold">Live Scam Trends</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-bold">Scam Types</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1f9d78" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-bold">Frequency Over Time</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.dailyFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-bold">Top Scam Keywords</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {trends.topKeywords.map((item) => (
            <span
              key={item.keyword}
              className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200"
            >
              {item.keyword} ({item.count})
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
