"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

const OUTREACH_STATUS_STYLES = {
  contacted:      { cls: "bg-blue-50 text-blue-600",    icon: "📧" },
  interested:     { cls: "bg-green-50 text-green-700",  icon: "✅" },
  not_interested: { cls: "bg-gray-100 text-gray-400",   icon: "✗"  },
  bounced:        { cls: "bg-red-50 text-red-500",      icon: "⚠️" },
  replied:        { cls: "bg-teal-50 text-teal-700",    icon: "💬" },
  unsubscribed:   { cls: "bg-yellow-50 text-yellow-700",icon: "🚫" },
};

const ACTIVITY_ICONS = {
  note: "💬", call: "📞", email: "✉️", meeting: "📅",
  task: "✅", deal: "💰", company: "🏢", contact: "👤", system: "⚙️",
};

export default function ActivityItem({ activity, onDelete, onUpdated }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(activity.content || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/activities/${activity._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setEditing(false);
      onUpdated?.({ ...activity, content });
      toast.success("Tallennettu");
    } catch {
      toast.error("Virhe tallennuksessa");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => { setEditing(false); setContent(activity.content || ""); };

  const isInstantly = activity.type === "email" && activity.metadata?.source === "instantly";
  const date = new Date(activity.createdAt);

  if (isInstantly) {
    const status = activity.metadata?.outreachStatus;
    const statusStyle = OUTREACH_STATUS_STYLES[status] || { cls: "bg-gray-100 text-gray-500", icon: "📧" };
    return (
      <div className="bg-white rounded-lg border border-indigo-100 p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0 mt-0.5">✉️</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Instantly</span>
                {activity.metadata?.campaignName && (
                  <span className="text-xs text-gray-600 font-medium truncate max-w-[180px]">{activity.metadata.campaignName}</span>
                )}
                {status && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.cls}`}>
                    {statusStyle.icon} {t(`crm.outreach.${status}`)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-400">{date.toLocaleString()}</span>
                <button onClick={() => setEditing(true)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                {onDelete && (
                  <button onClick={() => onDelete(activity._id)}
                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            {activity.contact && (
              <Link href={`/dashboard/crm/contacts/${activity.contact._id || activity.contact}`}
                className="text-xs text-indigo-600 hover:underline font-medium">
                {activity.contact.firstName} {activity.contact.lastName}
              </Link>
            )}
            {editing ? (
              <div className="mt-2">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={2}
                  autoFocus
                  placeholder="Lisää muistiinpano..."
                  className="w-full text-xs border border-indigo-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded disabled:opacity-50">
                    <CheckIcon className="h-3 w-3" />
                    {saving ? "..." : t("common.save")}
                  </button>
                  <button onClick={cancelEdit}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                    <XMarkIcon className="h-3 w-3" />
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : content ? (
              <p className="text-xs text-gray-500 mt-1.5 whitespace-pre-wrap">{content}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Generic activity (note, etc.)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{ACTIVITY_ICONS[activity.type] || "📌"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-800">{activity.createdBy?.name || "System"}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-gray-400">{date.toLocaleString()}</span>
              <button onClick={() => setEditing(true)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              {onDelete && (
                <button onClick={() => onDelete(activity._id)}
                  className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {editing ? (
            <div className="mt-2">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                autoFocus
                className="w-full text-sm border border-indigo-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex items-center gap-2 mt-1">
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded disabled:opacity-50">
                  <CheckIcon className="h-3 w-3" />
                  {saving ? "..." : t("common.save")}
                </button>
                <button onClick={cancelEdit}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                  <XMarkIcon className="h-3 w-3" />
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            content && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
