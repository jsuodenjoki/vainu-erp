"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import ModalBase from "@/components/crm/ModalBase";
import MultiPicker from "@/components/crm/MultiPicker";

const DIRECTIONS = ["outbound", "inbound"];
const OUTCOMES = ["connected", "left-voicemail", "no-answer", "busy", "wrong-number"];

export default function EditCallModal({ call, onClose, onUpdated }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactOptions, setContactOptions] = useState([]);
  const [dealOptions, setDealOptions] = useState([]);

  const toLocalDatetime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    callDate: toLocalDatetime(call.callDate),
    duration: call.duration || "",
    direction: call.direction || "outbound",
    outcome: call.outcome || "connected",
    notes: call.notes || "",
    contacts: (call.contacts || []).map(c => c._id || c),
    deals: (call.deals || []).map(d => d._id || d),
  });

  const companyId = call.company?._id || call.company;

  useEffect(() => {
    const url = companyId
      ? `/api/crm/contacts?company=${companyId}&limit=100`
      : "/api/crm/contacts?limit=100";
    fetch(url)
      .then(r => r.json())
      .then(d => setContactOptions((d.contacts || []).map(c => ({ _id: c._id, label: `${c.firstName} ${c.lastName}` }))))
      .catch(() => {});
  }, [companyId]);

  useEffect(() => {
    const url = companyId
      ? `/api/crm/deals?company=${companyId}&limit=100`
      : "/api/crm/deals?limit=100";
    fetch(url)
      .then(r => r.json())
      .then(d => setDealOptions((d.deals || []).map(d => ({ _id: d._id, label: d.title }))))
      .catch(() => {});
  }, [companyId]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        callDate: form.callDate,
        duration: form.duration ? parseInt(form.duration) : 0,
        direction: form.direction,
        outcome: form.outcome,
        notes: form.notes,
        contacts: form.contacts,
        deals: form.deals,
      };
      const res = await fetch(`/api/crm/calls/${call._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update call"); return; }
      onUpdated(data.call);
    } catch {
      setError("Failed to update call");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title={t("crm.calls.edit.title")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.calls.fields.direction")}</label>
            <select name="direction" value={form.direction} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DIRECTIONS.map(d => <option key={d} value={d}>{t(`crm.calls.direction.${d}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.calls.fields.outcome")}</label>
            <select name="outcome" value={form.outcome} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {OUTCOMES.map(o => <option key={o} value={o}>{t(`crm.calls.outcome.${o}`)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.calls.fields.callDate")}</label>
            <input name="callDate" type="datetime-local" value={form.callDate} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.calls.fields.duration")}</label>
            <input name="duration" type="number" min="0" value={form.duration} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <MultiPicker
          label={t("crm.meetings.fields.contacts")}
          items={contactOptions}
          selected={form.contacts}
          onChange={ids => setForm(prev => ({ ...prev, contacts: ids }))}
          placeholder={t("common.select")}
        />

        <MultiPicker
          label={t("crm.meetings.fields.deals")}
          items={dealOptions}
          selected={form.deals}
          onChange={ids => setForm(prev => ({ ...prev, deals: ids }))}
          placeholder={t("common.select")}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.calls.fields.notes")}</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">{t("common.cancel")}</button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
            {loading ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
