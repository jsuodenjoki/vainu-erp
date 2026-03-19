"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import ModalBase from "@/components/crm/ModalBase";
import MultiPicker from "@/components/crm/MultiPicker";

const TYPES = ["call", "email", "meeting", "task", "follow-up", "deadline"];
const PRIORITIES = ["low", "medium", "high"];

export default function CreateTaskModal({ companyId, companyName, contactId, dealId, onClose, onCreated }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [contactOptions, setContactOptions] = useState([]);
  const [dealOptions, setDealOptions] = useState([]);

  const [form, setForm] = useState({
    title: "",
    notes: "",
    dueDate: "",
    type: "task",
    priority: "medium",
    company: companyId || "",
    contacts: contactId ? [contactId] : [],
    deals: dealId ? [dealId] : [],
  });

  useEffect(() => {
    if (!companyId) {
      fetch("/api/crm/companies?limit=100")
        .then(r => r.json())
        .then(d => setCompanies(d.companies || []))
        .catch(() => {});
    }
  }, [companyId]);

  // Load contact options (filtered by company if set)
  useEffect(() => {
    const compId = companyId || form.company;
    const url = compId
      ? `/api/crm/contacts?company=${compId}&limit=100`
      : `/api/crm/contacts?limit=100`;
    fetch(url)
      .then(r => r.json())
      .then(d => setContactOptions((d.contacts || []).map(c => ({ _id: c._id, label: `${c.firstName} ${c.lastName}` }))))
      .catch(() => {});
  }, [companyId, form.company]);

  // Load deal options (filtered by company if set)
  useEffect(() => {
    const compId = companyId || form.company;
    const url = compId
      ? `/api/crm/deals?company=${compId}&limit=100`
      : `/api/crm/deals?limit=100`;
    fetch(url)
      .then(r => r.json())
      .then(d => setDealOptions((d.deals || []).map(d => ({ _id: d._id, label: d.title }))))
      .catch(() => {});
  }, [companyId, form.company]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(t("crm.tasks.fields.title") + " is required"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        notes: form.notes,
        dueDate: form.dueDate || undefined,
        type: form.type,
        priority: form.priority,
        company: form.company || undefined,
        contacts: form.contacts,
        deals: form.deals,
      };
      const res = await fetch("/api/crm/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create task"); return; }
      onCreated(data.task);
    } catch {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title={t("crm.tasks.create.title")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.title")} *</label>
          <input name="title" value={form.title} onChange={handleChange} required autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.type")}</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {TYPES.map(type => <option key={type} value={type}>{t(`crm.tasks.type.${type}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.priority")}</label>
            <select name="priority" value={form.priority} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PRIORITIES.map(p => <option key={p} value={p}>{t(`crm.tasks.priority.${p}`)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.dueDate")}</label>
          <input name="dueDate" type="datetime-local" value={form.dueDate} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {!companyId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.company")}</label>
            <select name="company" value={form.company} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t("common.select")}</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {companyId && companyName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.company")}</label>
            <input value={companyName} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
        )}

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
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.tasks.fields.notes")}</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
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
