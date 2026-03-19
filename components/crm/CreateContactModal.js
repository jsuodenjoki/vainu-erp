"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import ModalBase from "@/components/crm/ModalBase";

export default function CreateContactModal({ companyId, companyName, onClose, onCreated }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    company: companyId || "",
  });

  useEffect(() => {
    if (!companyId) {
      fetch("/api/crm/companies?limit=100")
        .then((r) => r.json())
        .then((d) => setCompanies(d.companies || []))
        .catch(() => {});
    }
  }, [companyId]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) { setError(t("crm.contacts.fields.firstName") + " is required"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = { ...form, company: form.company || undefined };
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create contact"); return; }
      onCreated(data.contact);
    } catch {
      setError("Failed to create contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title={t("crm.contacts.create.title")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.firstName")} *</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} required autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.lastName")}</label>
            <input name="lastName" value={form.lastName} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.email")}</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.phone")}</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.jobTitle")}</label>
            <input name="jobTitle" value={form.jobTitle} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {!companyId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.company")}</label>
            <select name="company" value={form.company} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t("common.select")}</option>
              {companies.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
          </div>
        )}
        {companyId && companyName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("crm.contacts.fields.company")}</label>
            <input value={companyName} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
        )}

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
