"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import ModalBase from "@/components/crm/ModalBase";

const STAGES = [
  "appointment-scheduled", "qualified-to-buy", "presentation-scheduled",
  "decision-maker-bought-in", "contract-sent", "closed-won", "closed-lost",
];

export default function CreateDealModal({ companyId, companyName, initialStage, onClose, onCreated }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    stage: initialStage || "appointment-scheduled",
    closeDate: "",
    probability: "",
    company: companyId || "",
    description: "",
  });

  useEffect(() => {
    if (!companyId) {
      fetch("/api/crm/companies?limit=100")
        .then((r) => r.json())
        .then((d) => setCompanies(d.companies || []))
        .catch(() => {});
    }
  }, [companyId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(t("crm.deals.fields.title") + " is required"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: form.amount ? parseFloat(form.amount) : 0,
        probability: form.probability ? parseInt(form.probability) : 0,
        closeDate: form.closeDate || undefined,
        company: form.company || undefined,
      };
      const res = await fetch("/api/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create deal"); return; }
      onCreated(data.deal);
    } catch {
      setError("Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title={t("crm.deals.create.title")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.title")} *</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.amount")}</label>
            <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.probability")}</label>
            <input name="probability" type="number" min="0" max="100" value={form.probability} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.stage")}</label>
          <select name="stage" value={form.stage} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {STAGES.map((s) => (<option key={s} value={s}>{t(`crm.deals.stages.${s}`)}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.closeDate")}</label>
          <input name="closeDate" type="date" value={form.closeDate} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {!companyId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.company")}</label>
            <select name="company" value={form.company} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t("common.select")}</option>
              {companies.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
          </div>
        )}
        {companyId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.deals.fields.company")}</label>
            <input value={companyName} disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.description")}</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">{t("common.cancel")}</button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
            {loading ? t("common.loading") : t("common.create")}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
