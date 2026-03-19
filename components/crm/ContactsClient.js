"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import { PlusIcon, MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import CreateContactModal from "@/components/crm/CreateContactModal";

export default function ContactsClient() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/crm/contacts?${params}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleCreated = () => {
    setShowCreate(false);
    fetchContacts();
    toast.success(t("crm.contacts.create.success"));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("crm.contacts.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} {t("crm.contacts.title").toLowerCase()}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <PlusIcon className="h-4 w-4" />
          {t("crm.contacts.newContact")}
        </button>
      </div>

      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("crm.contacts.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">{t("crm.contacts.noContacts")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("crm.contacts.noContactsDesc")}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <PlusIcon className="h-4 w-4" />
              {t("crm.contacts.newContact")}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.contacts.columns.name")}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.contacts.columns.email")}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.contacts.columns.phone")}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.contacts.columns.company")}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.contacts.columns.jobTitle")}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.contacts.columns.owner")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {contacts.map((contact) => (
                <tr key={contact._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/crm/contacts/${contact._id}`} className="flex items-center gap-3 group">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-red-700">
                          {contact.firstName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-indigo-600">
                        {contact.firstName} {contact.lastName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{contact.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {contact.company ? (
                      <Link href={`/dashboard/crm/companies/${contact.company._id}`} className="hover:text-indigo-600">
                        {contact.company.name}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{contact.jobTitle || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.owner?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateContactModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
