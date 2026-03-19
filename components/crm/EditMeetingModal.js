"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import ModalBase from "@/components/crm/ModalBase";
import { CheckIcon } from "@heroicons/react/24/outline";

const SUBTYPES = ["first-meeting", "discovery", "demo", "follow-up", "decision", "other"];
const TYPES = ["in-person", "video", "phone"];
const OUTCOMES = ["scheduled", "completed", "no-show", "cancelled", "rescheduled"];

function MultiPicker({ label, items, selected, onToggle, displayFn }) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? items.filter(item => displayFn(item).toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">–</p>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-50">
          <div className="px-2 py-1.5">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hae..."
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-28 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2">–</p>
            ) : filtered.map((item) => {
              const isSelected = selected.includes(item._id);
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => onToggle(item._id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${isSelected ? "bg-indigo-50" : ""}`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                    {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>
                  <span className={isSelected ? "text-indigo-700 font-medium" : "text-gray-700"}>
                    {displayFn(item)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditMeetingModal({ meeting, onClose, onUpdated }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  // Convert meetingDate to local datetime-local format
  const toLocalDatetime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: meeting.title || "",
    meetingDate: toLocalDatetime(meeting.meetingDate),
    duration: meeting.duration || "",
    location: meeting.location || "",
    type: meeting.type || "video",
    subtype: meeting.subtype || "other",
    outcome: meeting.outcome || "scheduled",
    notes: meeting.notes || "",
    contacts: (meeting.contacts || []).map(c => c._id || c),
    deals: (meeting.deals || []).map(d => d._id || d),
  });

  const companyId = meeting.company?._id || meeting.company;

  useEffect(() => {
    const url = companyId
      ? `/api/crm/contacts?company=${companyId}&limit=100`
      : "/api/crm/contacts?limit=100";
    fetch(url).then(r => r.json()).then(d => setContacts(d.contacts || [])).catch(() => {});
  }, [companyId]);

  useEffect(() => {
    const url = companyId
      ? `/api/crm/deals?company=${companyId}&limit=100`
      : "/api/crm/deals?limit=100";
    fetch(url).then(r => r.json()).then(d => setDeals(d.deals || [])).catch(() => {});
  }, [companyId]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleContact = (id) =>
    setForm(prev => ({
      ...prev,
      contacts: prev.contacts.includes(id) ? prev.contacts.filter(c => c !== id) : [...prev.contacts, id],
    }));

  const toggleDeal = (id) =>
    setForm(prev => ({
      ...prev,
      deals: prev.deals.includes(id) ? prev.deals.filter(d => d !== id) : [...prev.deals, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        duration: form.duration ? parseInt(form.duration) : 0,
      };
      const res = await fetch(`/api/crm/meetings/${meeting._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update meeting"); return; }
      onUpdated(data.meeting);
    } catch {
      setError("Failed to update meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title={t("crm.meetings.edit.title")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.title")}</label>
          <input name="title" value={form.title} onChange={handleChange} placeholder={t("crm.meetings.fields.title")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.subtype")}</label>
            <select name="subtype" value={form.subtype} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {SUBTYPES.map(s => <option key={s} value={s}>{t(`crm.meetings.subtype.${s}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.type")}</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {TYPES.map(tp => <option key={tp} value={tp}>{t(`crm.meetings.type.${tp}`)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.outcome")}</label>
            <select name="outcome" value={form.outcome} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {OUTCOMES.map(o => <option key={o} value={o}>{t(`crm.meetings.outcome.${o}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.meetingDate")}</label>
            <input name="meetingDate" type="datetime-local" value={form.meetingDate} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.duration")}</label>
            <input name="duration" type="number" min="0" value={form.duration} onChange={handleChange} placeholder="min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.location")}</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Toimisto / Meet..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <MultiPicker
          label={t("crm.meetings.fields.contacts")}
          items={contacts}
          selected={form.contacts}
          onToggle={toggleContact}
          displayFn={(c) => `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ""}`}
        />

        <MultiPicker
          label={t("crm.meetings.fields.deals")}
          items={deals}
          selected={form.deals}
          onToggle={toggleDeal}
          displayFn={(d) => d.title}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.meetings.fields.notes")}</label>
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
