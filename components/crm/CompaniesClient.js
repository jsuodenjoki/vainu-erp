"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  PhoneIcon,
  XMarkIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import CreateCompanyModal from "@/components/crm/CreateCompanyModal";
import toast from "react-hot-toast";

const LIFECYCLE_COLORS = {
  lead: "bg-blue-100 text-blue-700",
  prospect: "bg-purple-100 text-purple-700",
  opportunity: "bg-orange-100 text-orange-700",
  customer: "bg-green-100 text-green-700",
  evangelist: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
};

const STAGES = ["lead", "prospect", "opportunity", "customer", "evangelist", "other"];

export default function CompaniesClient() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter) params.set("stage", stageFilter);
      const res = await fetch(`/api/crm/companies?${params}`);
      const data = await res.json();
      setCompanies(data.companies || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  // Fetch users for bulk owner assign
  useEffect(() => {
    fetch("/api/crm/users")
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  // Clear selection when filter/search changes
  useEffect(() => { setSelectedIds(new Set()); }, [search, stageFilter]);

  const handleCreated = (company) => {
    setCompanies((prev) => [company, ...prev]);
    setShowCreate(false);
    toast.success(t("crm.companies.create.success"));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === companies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(companies.map(c => c._id)));
    }
  };

  const bulkUpdate = async (updates) => {
    setBulkProcessing(true);
    try {
      await Promise.all(
        [...selectedIds].map(id =>
          fetch(`/api/crm/companies/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          })
        )
      );
      setSelectedIds(new Set());
      fetchCompanies();
      toast.success(`${selectedIds.size} yritystä päivitetty`);
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkProcessing(false);
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Poistetaanko ${selectedIds.size} yritystä? Tätä ei voi peruuttaa.`)) return;
    setBulkProcessing(true);
    try {
      await Promise.all(
        [...selectedIds].map(id =>
          fetch(`/api/crm/companies/${id}`, { method: "DELETE" })
        )
      );
      setSelectedIds(new Set());
      fetchCompanies();
      toast.success(`${selectedIds.size} yritystä poistettu`);
    } catch {
      toast.error("Delete failed");
    } finally {
      setBulkProcessing(false);
    }
  };

  const deleteCompany = async (id, name) => {
    if (!confirm(`Poistetaanko "${name}"? Tätä ei voi peruuttaa.`)) return;
    try {
      await fetch(`/api/crm/companies/${id}`, { method: "DELETE" });
      setCompanies(prev => prev.filter(c => c._id !== id));
      setTotal(prev => prev - 1);
      toast.success("Yritys poistettu");
    } catch {
      toast.error("Poisto epäonnistui");
    }
  };

  const allSelected = companies.length > 0 && selectedIds.size === companies.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("crm.companies.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} {total === 1 ? "company" : "companies"}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t("crm.companies.newCompany")}
        </button>
      </div>

      {/* Search & filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-4 flex-wrap">
        <div className="relative max-w-sm flex-shrink-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("crm.companies.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStageFilter("")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              stageFilter === "" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("common.all")}
          </button>
          {STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stageFilter === stage ? "" : stage)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                stageFilter === stage
                  ? LIFECYCLE_COLORS[stage] + " ring-2 ring-offset-1 ring-current"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t(`crm.lifecycleStage.${stage}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-200 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-indigo-700">
              {selectedIds.size} valittu
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-indigo-400 hover:text-indigo-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="h-4 w-px bg-indigo-300" />
          {/* Change owner */}
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <select
              disabled={bulkProcessing}
              defaultValue=""
              onChange={e => {
                const val = e.target.value;
                if (val === "__clear__") bulkUpdate({ owner: null });
                else if (val) bulkUpdate({ owner: val });
                e.target.value = "";
              }}
              className="text-xs border border-indigo-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Vaihda omistaja…</option>
              <option value="__clear__">— Ei omistajaa</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name || u.email}</option>
              ))}
            </select>
          </div>
          {/* Change stage */}
          <div className="flex items-center gap-1.5">
            <select
              disabled={bulkProcessing}
              defaultValue=""
              onChange={e => {
                const val = e.target.value;
                if (val) { bulkUpdate({ lifecycleStage: val }); e.target.value = ""; }
              }}
              className="text-xs border border-indigo-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Vaihda vaihe…</option>
              {STAGES.map(s => (
                <option key={s} value={s}>{t(`crm.lifecycleStage.${s}`)}</option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-indigo-300" />
          {/* Delete */}
          <button
            onClick={bulkDelete}
            disabled={bulkProcessing}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            Poista valitut
          </button>
          {bulkProcessing && (
            <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full ml-1" />
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BuildingOffice2Icon className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">{t("crm.companies.noCompanies")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("crm.companies.noCompaniesDesc")}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <PlusIcon className="h-4 w-4" />
              {t("crm.companies.newCompany")}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="pl-4 pr-2 py-3 w-10 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide w-64">
                  {t("crm.companies.columns.name")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                  {t("crm.companies.columns.phone")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                  {t("crm.companies.columns.stage")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                  {t("crm.companies.columns.owner")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                  {t("crm.companies.columns.createdAt")}
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {companies.map((company) => {
                const isSelected = selectedIds.has(company._id);
                // Show only domain, strip protocol + path + query params
                const domain = company.website
                  ? company.website.replace(/^https?:\/\//, "").split("?")[0].split("/")[0]
                  : null;
                return (
                  <tr
                    key={company._id}
                    className={`transition-colors group/row ${isSelected ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="pl-4 pr-2 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(company._id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 w-64">
                      <Link
                        href={`/dashboard/crm/companies/${company._id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-8 w-8 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-700">
                            {company.name?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {company.name}
                          </p>
                          {domain && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <GlobeAltIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{domain}</span>
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {company.phone ? (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3 text-gray-400" />
                          {company.phone}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {company.lifecycleStage ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LIFECYCLE_COLORS[company.lifecycleStage] || LIFECYCLE_COLORS.other}`}>
                          {t(`crm.lifecycleStage.${company.lifecycleStage}`)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
                      {company.owner?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {company.createdAt
                        ? new Date(company.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-2 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => deleteCompany(company._id, company.name)}
                        className="p-1 rounded text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/row:opacity-100"
                        title="Poista yritys"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
