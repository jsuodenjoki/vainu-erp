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

export default function CompaniesClient() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/crm/companies?${params}`);
      const data = await res.json();
      setCompanies(data.companies || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  const handleCreated = (company) => {
    setCompanies((prev) => [company, ...prev]);
    setShowCreate(false);
    toast.success(t("crm.companies.create.success"));
  };

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
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("crm.companies.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

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
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  {t("crm.companies.columns.name")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  {t("crm.companies.columns.phone")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  {t("crm.companies.columns.stage")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  {t("crm.companies.columns.owner")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  {t("crm.companies.columns.createdAt")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      href={`/dashboard/crm/companies/${company._id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="h-8 w-8 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">
                          {company.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {company.name}
                        </p>
                        {company.website && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <GlobeAltIcon className="h-3 w-3" />
                            {company.website.replace(/^https?:\/\//, "")}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {company.phone ? (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3 text-gray-400" />
                        {company.phone}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {company.lifecycleStage ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LIFECYCLE_COLORS[company.lifecycleStage] || LIFECYCLE_COLORS.other}`}>
                        {t(`crm.lifecycleStage.${company.lifecycleStage}`)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {company.owner?.name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
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
