import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import api from "../services/api";
import { getRiskColor, getRiskLabel } from "../utils/risk";

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/scan/history");
        setScans(response.data.scans);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-2xl font-extrabold">Scan History</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">View your previous scam detection records.</p>

      {loading ? (
        <div className="mt-5">
          <Loader text="Loading history" />
        </div>
      ) : scans.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">No history available yet.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan._id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">{new Date(scan.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{scan.inputType}</td>
                  <td className="px-3 py-2 capitalize">{scan.category}</td>
                  <td className="px-3 py-2">{scan.scamScore}%</td>
                  <td className={`px-3 py-2 font-semibold ${getRiskColor(scan.scamScore)}`}>
                    {getRiskLabel(scan.scamScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
