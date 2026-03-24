"use client";

import Link from "next/link";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/components/I18nProvider";

const CALL_OUTCOME_COLORS = {
  connected: "bg-green-100 text-green-700",
  "left-voicemail": "bg-blue-100 text-blue-700",
  "no-answer": "bg-gray-100 text-gray-600",
  busy: "bg-yellow-100 text-yellow-700",
  "wrong-number": "bg-red-100 text-red-700",
};

export default function CallItem({ call, onEdit, onDelete }) {
  const { t } = useI18n();
  const date = call._date instanceof Date ? call._date : new Date(call.callDate || call._date);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">📞</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Outcome as title */}
              <div className="flex items-center gap-2 flex-wrap">
                {call.outcome && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CALL_OUTCOME_COLORS[call.outcome] || "bg-gray-100 text-gray-600"}`}>
                    {t(`crm.calls.outcome.${call.outcome}`)}
                  </span>
                )}
                <span className="text-xs text-gray-400">{t(`crm.calls.direction.${call.direction || "outbound"}`)}</span>
                {call.duration > 0 && <span className="text-xs text-gray-400">{call.duration} min</span>}
              </div>
              {call.contacts?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {call.contacts.map(c => (
                    <Link key={c._id} href={`/dashboard/crm/contacts/${c._id}`}
                      className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-0.5 rounded-full">
                      {c.firstName} {c.lastName}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-gray-400">{date.toLocaleString()}</span>
              {onEdit && (
                <button onClick={() => onEdit(call)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(call._id)}
                  className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {call.notes && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{call.notes}</p>}
          {call.deals?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {call.deals.map(d => (
                <Link key={d._id} href={`/dashboard/crm/deals/${d._id}`}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {d.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
