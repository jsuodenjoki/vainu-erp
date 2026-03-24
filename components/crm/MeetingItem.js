"use client";

import Link from "next/link";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/components/I18nProvider";

const MEETING_OUTCOME_COLORS = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  "no-show": "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
  rescheduled: "bg-yellow-100 text-yellow-700",
};

const MEETING_SUBTYPE_COLORS = {
  "first-meeting": "bg-purple-100 text-purple-700",
  discovery: "bg-blue-100 text-blue-700",
  demo: "bg-indigo-100 text-indigo-700",
  "follow-up": "bg-orange-100 text-orange-700",
  decision: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-600",
};

export default function MeetingItem({ meeting, onEdit, onDelete }) {
  const { t } = useI18n();
  const date = meeting._date instanceof Date ? meeting._date : new Date(meeting.meetingDate || meeting._date);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{meeting.source === "google" ? "🗓️" : "📅"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-800">
                  {meeting.title || t(`crm.meetings.subtype.${meeting.subtype || "other"}`)}
                </p>
                {meeting.source === "google" && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Google</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MEETING_SUBTYPE_COLORS[meeting.subtype] || "bg-gray-100 text-gray-600"}`}>
                  {t(`crm.meetings.subtype.${meeting.subtype || "other"}`)}
                </span>
                {meeting.outcome && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MEETING_OUTCOME_COLORS[meeting.outcome] || "bg-gray-100 text-gray-600"}`}>
                    {t(`crm.meetings.outcome.${meeting.outcome}`)}
                  </span>
                )}
                {meeting.type && (
                  <span className="text-xs text-gray-400">{t(`crm.meetings.type.${meeting.type}`)}</span>
                )}
                {meeting.duration > 0 && <span className="text-xs text-gray-400">{meeting.duration} min</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400">{date.toLocaleString()}</span>
              {onEdit && (
                <button onClick={() => onEdit(meeting)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(meeting._id)}
                  className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {meeting.contacts?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {meeting.contacts.map(c => (
                <Link key={c._id} href={`/dashboard/crm/contacts/${c._id}`}
                  className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-0.5 rounded-full">
                  {c.firstName} {c.lastName}
                </Link>
              ))}
            </div>
          )}
          {meeting.deals?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {meeting.deals.map(d => (
                <Link key={d._id} href={`/dashboard/crm/deals/${d._id}`}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {d.title}
                </Link>
              ))}
            </div>
          )}
          {meeting.notes && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{meeting.notes}</p>}
        </div>
      </div>
    </div>
  );
}
