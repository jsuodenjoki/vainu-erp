"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";
import { BoltIcon } from "@heroicons/react/24/outline";

const ACTIVITY_ICONS = {
  note: "💬",
  call: "📞",
  email: "✉️",
  meeting: "📅",
  task: "✅",
  deal: "💰",
  company: "🏢",
  contact: "👤",
  system: "⚙️",
};

export default function ActivitiesClient() {
  const { t } = useI18n();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/crm/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (userFilter) params.set("userId", userFilter);
        const res = await fetch(`/api/crm/activities?${params}`);
        const data = await res.json();
        setActivities(data.activities || []);
      } catch {
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [userFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">{t("crm.activities.title")}</h1>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t("crm.filters.allUsers")}</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BoltIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{t("crm.activities.noActivities")}</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-3">
            {activities.map((activity) => (
              <div key={activity._id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{ACTIVITY_ICONS[activity.type] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {activity.createdBy?.name || "System"}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {t(`crm.activities.types.${activity.type}`)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {activity.content && (
                      <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap">{activity.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
