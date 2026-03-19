"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import { PlusIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import CreateMeetingModal from "@/components/crm/CreateMeetingModal";

const TYPE_ICONS = {
  "in-person": "🤝",
  video: "💻",
  phone: "📞",
};

const OUTCOME_COLORS = {
  completed: "bg-green-100 text-green-700",
  "no-show": "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
  rescheduled: "bg-yellow-100 text-yellow-700",
};

export default function MeetingsClient() {
  const { t } = useI18n();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/crm/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilter) params.set("userId", userFilter);
      const res = await fetch(`/api/crm/meetings?${params}`);
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [userFilter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleCreated = (meeting) => {
    setMeetings((prev) => [meeting, ...prev]);
    setShowCreate(false);
    toast.success(t("crm.meetings.create.success"));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">{t("crm.meetings.title")}</h1>
        <div className="flex items-center gap-2">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("crm.filters.allUsers")}</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <PlusIcon className="h-4 w-4" />
            {t("crm.meetings.newMeeting")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">{t("crm.meetings.title")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("crm.meetings.noMeetingsDesc")}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <PlusIcon className="h-4 w-4" />
              {t("crm.meetings.newMeeting")}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {meetings.map((meeting) => (
              <div key={meeting._id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="mt-0.5 h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-lg">
                  {TYPE_ICONS[meeting.type] || "📅"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800">
                      {meeting.title || t(`crm.meetings.type.${meeting.type}`)}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(meeting.meetingDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {meeting.company && (
                      <Link href={`/dashboard/crm/companies/${meeting.company._id}`} className="text-xs text-gray-500 hover:text-indigo-600">
                        {meeting.company.name}
                      </Link>
                    )}
                    {meeting.contact && (
                      <Link href={`/dashboard/crm/contacts/${meeting.contact._id}`} className="text-xs text-gray-500 hover:text-indigo-600">
                        {meeting.contact.firstName} {meeting.contact.lastName}
                      </Link>
                    )}
                    {meeting.duration > 0 && (
                      <span className="text-xs text-gray-400">{meeting.duration} min</span>
                    )}
                    {meeting.location && (
                      <span className="text-xs text-gray-400 truncate max-w-[160px]">{meeting.location}</span>
                    )}
                    {meeting.outcome && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OUTCOME_COLORS[meeting.outcome] || "bg-gray-100 text-gray-600"}`}>
                        {t(`crm.meetings.outcome.${meeting.outcome}`)}
                      </span>
                    )}
                  </div>
                  {meeting.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded p-2">{meeting.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{meeting.createdBy?.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateMeetingModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
