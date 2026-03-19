"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import { PlusIcon, Squares2X2Icon, ListBulletIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";
import CreateDealModal from "@/components/crm/CreateDealModal";

const STAGES = [
  "appointment-scheduled",
  "qualified-to-buy",
  "presentation-scheduled",
  "decision-maker-bought-in",
  "contract-sent",
  "closed-won",
  "closed-lost",
];

const STAGE_COLORS = {
  "appointment-scheduled": "border-blue-400",
  "qualified-to-buy": "border-indigo-400",
  "presentation-scheduled": "border-purple-400",
  "decision-maker-bought-in": "border-orange-400",
  "contract-sent": "border-yellow-400",
  "closed-won": "border-green-400",
  "closed-lost": "border-red-400",
};

const STAGE_BG = {
  "appointment-scheduled": "bg-blue-50",
  "qualified-to-buy": "bg-indigo-50",
  "presentation-scheduled": "bg-purple-50",
  "decision-maker-bought-in": "bg-orange-50",
  "contract-sent": "bg-yellow-50",
  "closed-won": "bg-green-50",
  "closed-lost": "bg-red-50",
};

export default function DealsClient() {
  const { t } = useI18n();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [createStage, setCreateStage] = useState("");

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/deals");
      const data = await res.json();
      setDeals(data.deals || []);
    } catch {
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const handleCreated = (deal) => {
    setDeals((prev) => [deal, ...prev]);
    setShowCreate(false);
    toast.success(t("crm.deals.create.success"));
  };

  const handleMoveDeal = async (dealId, newStage) => {
    try {
      await fetch(`/api/crm/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      setDeals((prev) =>
        prev.map((d) => (d._id === dealId ? { ...d, stage: newStage } : d))
      );
    } catch {
      toast.error("Failed to move deal");
    }
  };

  const totalValue = deals
    .filter((d) => d.stage !== "closed-lost")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("crm.deals.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t("crm.deals.totalValue")}: <span className="font-medium text-gray-700">€{totalValue.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === "kanban" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              {t("crm.deals.viewKanban")}
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              {t("crm.deals.viewList")}
            </button>
          </div>
          <button
            onClick={() => { setCreateStage(""); setShowCreate(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {t("crm.deals.newDeal")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : view === "kanban" ? (
        /* Kanban view */
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 p-4 h-full min-w-max">
            {STAGES.map((stage) => {
              const stageDeals = dealsByStage[stage] || [];
              const stageTotal = stageDeals.reduce((s, d) => s + (d.amount || 0), 0);
              return (
                <div key={stage} className="flex flex-col w-64 flex-shrink-0">
                  <div className={`rounded-t-lg px-3 py-2 ${STAGE_BG[stage]}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide truncate">
                        {t(`crm.deals.stages.${stage}`)}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium bg-white px-1.5 py-0.5 rounded-full ml-1">
                        {stageDeals.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">€{stageTotal.toLocaleString()}</p>
                  </div>

                  <div
                    className="flex-1 bg-gray-100 rounded-b-lg p-2 space-y-2 min-h-40 overflow-y-auto"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dealId = e.dataTransfer.getData("dealId");
                      if (dealId) handleMoveDeal(dealId, stage);
                    }}
                  >
                    {stageDeals.map((deal) => (
                      <div
                        key={deal._id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("dealId", deal._id)}
                        className={`bg-white rounded-lg p-3 shadow-sm border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${STAGE_COLORS[stage]}`}
                      >
                        <Link
                          href={`/dashboard/crm/deals/${deal._id}`}
                          className="text-sm font-medium text-gray-800 hover:text-indigo-600 block truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deal.title}
                        </Link>
                        {deal.amount !== undefined && (
                          <p className="text-sm font-semibold text-gray-700 mt-1">
                            €{deal.amount?.toLocaleString()}
                          </p>
                        )}
                        {deal.company && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{deal.company.name}</p>
                        )}
                        {deal.closeDate && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(deal.closeDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => { setCreateStage(stage); setShowCreate(true); }}
                      className="w-full text-xs text-gray-400 hover:text-indigo-600 hover:bg-white py-2 rounded-lg flex items-center justify-center gap-1 transition-colors border border-dashed border-gray-300 hover:border-indigo-400"
                    >
                      <PlusIcon className="h-3 w-3" />
                      {t("crm.deals.newDeal")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="flex-1 overflow-auto">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CurrencyEuroIcon className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">{t("crm.deals.noDeals")}</h3>
              <p className="text-sm text-gray-500">{t("crm.deals.noDealsDesc")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.deals.fields.title")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.deals.fields.amount")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.deals.fields.stage")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.deals.fields.company")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.deals.fields.closeDate")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{t("crm.deals.fields.owner")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {deals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/crm/deals/${deal._id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {deal.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {deal.amount ? `€${deal.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_BG[deal.stage] || "bg-gray-100"} ${STAGE_COLORS[deal.stage]?.replace("border-", "text-").replace("-400", "-700") || "text-gray-700"}`}>
                        {t(`crm.deals.stages.${deal.stage}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {deal.company ? (
                        <Link href={`/dashboard/crm/companies/${deal.company._id}`} className="hover:text-indigo-600">
                          {deal.company.name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{deal.owner?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <CreateDealModal
          initialStage={createStage}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
