import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import api from "../services/api";

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const response = await api.get("/admin/overview");
      setOverview(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load admin panel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleFlagToggle = async (scanId, flagged) => {
    try {
      await api.patch("/admin/flag", { scanId, flagged: !flagged });
      toast.success("Flag status updated");
      fetchOverview();
    } catch (error) {
      toast.error("Could not update flag status");
    }
  };

  if (loading) return <Loader text="Loading admin analytics" />;
  if (!overview) return <p className="text-sm text-slate-500">No admin data.</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-extrabold">Admin Panel</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Users" value={overview.metrics.totalUsers} />
        <StatCard title="Scans" value={overview.metrics.totalScans} />
        <StatCard title="Reports" value={overview.metrics.totalReports} tone="warning" />
        <StatCard title="High Risk" value={overview.metrics.highRiskScans} tone="danger" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-bold">Flagged Content</h2>
        <div className="mt-4 space-y-3">
          {overview.flaggedContent.length === 0 ? (
            <p className="text-sm text-slate-500">No flagged records.</p>
          ) : (
            overview.flaggedContent.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold capitalize">
                    {item.category} - {item.scamScore}%
                  </p>
                  <button
                    onClick={() => handleFlagToggle(item._id, item.flaggedByCommunity)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold dark:border-slate-600"
                  >
                    {item.flaggedByCommunity ? "Unflag" : "Flag"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.explanation}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
