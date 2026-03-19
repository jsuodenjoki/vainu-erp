"use client";

import { useI18n } from "@/components/I18nProvider";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Papa from "papaparse";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

function GoogleIntegration() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const status = searchParams.get("google");
    if (status === "connected") toast.success(t("crm.integrations.google.connectSuccess"));
    if (status === "error") toast.error(t("crm.integrations.google.connectError"));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/integrations/google/status")
      .then(r => r.json())
      .then(d => setGoogleConnected(d.connected))
      .catch(() => setGoogleConnected(false));
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/google/status", { method: "DELETE" });
      setGoogleConnected(false);
      toast.success(t("crm.integrations.google.disconnectSuccess"));
    } catch {
      toast.error("Error");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-gray-900">{t("crm.integrations.google.title")}</h2>
            {googleConnected === true && (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {t("crm.integrations.google.connected")}
              </span>
            )}
            {googleConnected === false && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {t("crm.integrations.google.notConnected")}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3">{t("crm.integrations.google.description")}</p>

          <div className="text-xs text-gray-400 space-y-1 mb-4">
            <p>✓ Gmail – {t("crm.integrations.google.gmailScope")}</p>
            <p>✓ Google Calendar – {t("crm.integrations.google.calendarScope")}</p>
          </div>

          <div className="flex gap-2">
            {googleConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50"
              >
                {disconnecting ? t("common.loading") : t("crm.integrations.google.disconnect")}
              </button>
            ) : (
              <a
                href="/api/integrations/google/connect"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("crm.integrations.google.connect")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Instantly column name aliases → canonical key
const COL_ALIASES = {
  email: ["Email", "email"],
  firstName: ["First Name", "firstName", "first_name"],
  lastName: ["Last Name", "lastName", "last_name"],
  jobTitle: ["jobTitle", "Job Title", "title"],
  companyName: ["companyName", "Company Name", "company"],
  linkedIn: ["linkedIn", "LinkedIn", "linkedin_url"],
  campaignName: ["Campaign Name", "campaign"],
  leadStatus: ["Lead Status", "lead_status"],
  interestStatus: ["Interest Status", "interest_status"],
};

const OUTREACH_STATUS_COLORS = {
  contacted: "bg-blue-50 text-blue-700",
  bounced: "bg-red-50 text-red-600",
  replied: "bg-green-50 text-green-700",
  not_interested: "bg-gray-100 text-gray-500",
  interested: "bg-indigo-50 text-indigo-700",
  unsubscribed: "bg-yellow-50 text-yellow-700",
};

function ImportContacts() {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      toast.error(t("crm.import.errorNoFile"));
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data);
        setHeaders(res.meta.fields || []);
        setResult(null);
      },
      error: () => toast.error(t("crm.import.errorParse")),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!rows?.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/crm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      toast.success(`✓ ${data.created + data.updated} kontaktia tuotu`);
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setRows(null);
    setHeaders([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Detect which known columns are present
  const detectedCols = Object.entries(COL_ALIASES)
    .filter(([, aliases]) => aliases.some(a => headers.includes(a)))
    .map(([key]) => key);

  const previewRows = rows?.slice(0, 5) || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <ArrowUpTrayIcon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{t("crm.import.title")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("crm.import.description")}</p>
        </div>
      </div>

      {!rows && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
            dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
        >
          <ArrowUpTrayIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {t("crm.import.dropzone")}{" "}
            <span className="text-indigo-600 font-medium">{t("crm.import.browse")}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">CSV · Instantly-vienti</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {rows && !result && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-800">{rows.length} {t("crm.import.rows")}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{t("crm.import.detectedCols")}:</span>
            <div className="flex flex-wrap gap-1">
              {detectedCols.map(col => (
                <span key={col} className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  <CheckBadgeIcon className="h-3 w-3" />
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {["Email", "First Name", "Last Name", "jobTitle", "companyName", "Interest Status", "Lead Status"].map(h => (
                    headers.includes(h) && <th key={h} className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {["Email", "First Name", "Last Name", "jobTitle", "companyName", "Interest Status", "Lead Status"].map(h =>
                      headers.includes(h) && (
                        <td key={h} className="px-3 py-2 text-gray-700 max-w-[160px] truncate">
                          {h === "Lead Status" && row[h] ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              row[h].toLowerCase().includes("bounced") ? "bg-red-50 text-red-600" :
                              "bg-blue-50 text-blue-700"
                            }`}>{row[h]}</span>
                          ) : h === "Interest Status" && row[h] ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              row[h].toLowerCase().includes("not interested") ? "bg-gray-100 text-gray-500" :
                              row[h].toLowerCase().includes("meeting") ? "bg-green-50 text-green-700" :
                              "bg-indigo-50 text-indigo-700"
                            }`}>{row[h]}</span>
                          ) : (
                            row[h] || <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                + {rows.length - 5} lisää riviä...
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button onClick={handleImport} disabled={importing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50">
              {importing ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  {t("crm.import.importing")}
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {t("crm.import.importBtn")} ({rows.length})
                </>
              )}
            </button>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="font-medium text-sm">{t("crm.import.result")}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("crm.import.created"), value: result.created, color: "text-green-700 bg-green-50" },
              { label: t("crm.import.updated"), value: result.updated, color: "text-blue-700 bg-blue-50" },
              { label: t("crm.import.skipped"), value: result.skipped, color: "text-gray-600 bg-gray-100" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-medium text-red-700 mb-1">Virheet ({result.errors.length}):</p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e.email}: {e.error}</p>
              ))}
            </div>
          )}
          <button onClick={reset}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {t("crm.import.reset")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CRMSettingsPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">{t("crm.integrations.title")}</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Integraatiot</h2>
          <Suspense fallback={null}>
            <GoogleIntegration />
          </Suspense>
        </div>
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tietojen tuonti</h2>
          <ImportContacts />
        </div>

        {/* Setup instructions — Google */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">{t("crm.integrations.google.setupTitle")}</h3>
          <ol className="space-y-1.5 list-decimal list-inside text-xs text-gray-500">
            <li>{t("crm.integrations.google.step1")}</li>
            <li>{t("crm.integrations.google.step2")}</li>
            <li>{t("crm.integrations.google.step3")}</li>
            <li>{t("crm.integrations.google.step4")}</li>
          </ol>
          <p className="text-xs text-gray-400 mt-3 font-medium">{t("crm.integrations.google.callbackLabel")}</p>
          <div className="mt-1 bg-white border border-gray-200 rounded px-3 py-2 font-mono text-xs text-gray-500 break-all">
            {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/integrations/google/callback
          </div>
        </div>
      </div>
    </div>
  );
}
