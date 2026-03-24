"use client";

import Link from "next/link";
import { CheckIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/components/I18nProvider";

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const { t } = useI18n();
  const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
      {onToggle && (
        <button onClick={() => onToggle(task)}
          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
            task.status === "completed" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-indigo-500"
          }`}>
          {task.status === "completed" && <CheckIcon className="h-2.5 w-2.5 text-white" />}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
            {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
        {task.deals?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.deals.map(d => (
              <Link key={d._id} href={`/dashboard/crm/deals/${d._id}`}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {d.title}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {task.assignedTo?.name && (
          <span className="text-xs text-gray-400 mr-1">{task.assignedTo.name}</span>
        )}
        {onEdit && (
          <button onClick={() => onEdit(task)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(task._id)}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
