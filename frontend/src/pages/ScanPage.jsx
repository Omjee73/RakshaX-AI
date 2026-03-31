import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import Loader from "../components/Loader";
import ScanResultCard from "../components/ScanResultCard";
import api from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { exportNodeAsPdf } from "../utils/pdfExport";
import { useAuth } from "../context/AuthContext";

export default function ScanPage() {
  const { user } = useAuth();
  const [inputType, setInputType] = useState("text");
  const [contextType, setContextType] = useState("general");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scan, setScan] = useState(null);
  const [includeAccountEmail, setIncludeAccountEmail] = useState(true);
  const [extraEmails, setExtraEmails] = useState("");

  const resultRef = useRef(null);
  const debouncedContent = useDebounce(content, 500);

  const canSubmit = useMemo(() => {
    if (inputType === "image" || inputType === "document") return Boolean(image);
    if (inputType === "url") return debouncedContent.length > 4 || sourceUrl.length > 4;
    return debouncedContent.length > 4;
  }, [debouncedContent, image, inputType, sourceUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      let response;

      if (inputType === "image" || inputType === "document") {
        const formData = new FormData();
        formData.append("inputType", inputType);
        formData.append("contextType", contextType);
        formData.append("content", "ocr");
        formData.append("file", image);

        response = await api.post("/scan/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await api.post("/scan/analyze", {
          inputType,
          contextType,
          content,
          sourceUrl
        });
      }

      setScan(response.data.scan);
      toast.success("Scan completed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!scan) return;

    try {
      const additionalEmails = extraEmails
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      const response = await api.post("/report/vote", {
        scanId: scan._id,
        voteType,
        tags: [scan.category],
        includeAccountEmail,
        additionalEmails
      });
      const sentCount = response.data?.notifications?.requested || 0;
      toast.success(`Vote recorded. Email report sent to ${sentCount} recipient(s).`);
    } catch (error) {
      toast.error("Could not submit vote");
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-extrabold">Scam Analyzer</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Submit suspicious text, links, or screenshots and get risk analysis.
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Note: AI scan needs valid AIPIPE token configured in backend.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Select Content Type</p>
          <select
            value={inputType}
            onChange={(event) => setInputType(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="text">Text Message</option>
            <option value="url">URL / Website</option>
            <option value="image">Image Screenshot</option>
            <option value="document">Document Upload</option>
          </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Message Context</p>
          <select
            value={contextType}
            onChange={(event) => setContextType(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="general">General</option>
            <option value="payment-request">Payment Request</option>
            <option value="terms-conditions">Terms and Conditions</option>
            <option value="documents">Documents</option>
            <option value="job-offer">Job Offer</option>
            <option value="social-message">Social Message</option>
            <option value="email">Email</option>
          </select>
          </div>

          {inputType === "text" || inputType === "url" ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {inputType === "url" ? "Message/Context Around URL" : "Suspicious Text"}
              </p>
            <textarea
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                inputType === "url"
                  ? "Paste message text, email body, or reason why this URL looks suspicious"
                  : "Paste suspicious SMS/WhatsApp/email text here"
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            </div>
          ) : (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {inputType === "image" ? "Upload Screenshot" : "Upload Document"}
              </p>
            <input
              type="file"
              accept={inputType === "image" ? "image/*" : ".pdf,.txt,.docx,.csv,.json"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700 dark:border-slate-700 dark:bg-slate-950"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
            />
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Source URL (Optional)</p>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="Example: https://example.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <button
            disabled={!canSubmit || loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze Content"}
          </button>
        </form>

        {loading && (
          <div className="mt-4">
            <Loader text="Scanning with AI and OCR" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <ScanResultCard ref={resultRef} scan={scan} />

        {scan && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Vote Report Email Options</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose where the vote report email should be sent.
            </p>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeAccountEmail}
                onChange={(event) => setIncludeAccountEmail(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Send to my login email ({user?.email || "not available"})
            </label>

            <input
              value={extraEmails}
              onChange={(event) => setExtraEmails(event.target.value)}
              placeholder="Add more emails (comma separated)"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleVote("up")}
                className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
              >
                Mark Safe
              </button>
              <button
                onClick={() => handleVote("down")}
                className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 dark:border-rose-700 dark:text-rose-300"
              >
                Mark Scam
              </button>
                <button
                  onClick={() => exportNodeAsPdf(resultRef.current, `RakshaX-AI-Report-${scan._id}.pdf`)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Export PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
