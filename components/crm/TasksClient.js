"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import { PlusIcon, CheckCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import CreateTaskModal from "@/components/crm/CreateTaskModal";

const PRIORITY_COLORS = {
  low: "text-gray-400",
  medium: "text-yellow-500",
  high: "text-red-500",
};

const TYPE_ICONS = {
  call: "📞",
  email: "✉️",
  meeting: "📅",
  task: "✅",
  "follow-up": "🔁",
  deadline: "⏰",
};

export default function TasksClient() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/crm/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (userFilter) params.set("userId", userFilter);
      const res = await fetch(`/api/crm/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, userFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleToggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "not-started" : "completed";
    try {
      const res = await fetch(`/api/crm/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data.task : t)));
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleCreated = (task) => {
    setTasks((prev) => [task, ...prev]);
    setShowCreate(false);
    toast.success(t("crm.tasks.create.success"));
  };

  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now
  );
  const upcoming = tasks.filter(
    (t) => t.status !== "completed" && (!t.dueDate || new Date(t.dueDate) >= now)
  );
  const completed = tasks.filter((t) => t.status === "completed");

  const TaskRow = ({ task }) => {
    const isOverdue =
      task.status !== "completed" && task.dueDate && new Date(task.dueDate) < now;
    return (
      <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <button
          onClick={() => handleToggleTask(task)}
          className={`mt-0.5 h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.status === "completed"
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-indigo-500"
          }`}
        >
          {task.status === "completed" && <CheckIcon className="h-3 w-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
              {task.title}
            </span>
            {task.type && (
              <span className="text-xs">{TYPE_ICONS[task.type]}</span>
            )}
            <span className={`text-xs ${PRIORITY_COLORS[task.priority] || "text-gray-400"}`}>
              {t(`crm.tasks.priority.${task.priority}`)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {task.dueDate && (
              <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {isOverdue ? t("crm.tasks.sections.overdue") + " · " : ""}
                {new Date(task.dueDate).toLocaleString()}
              </span>
            )}
            {task.company && (
              <Link href={`/dashboard/crm/companies/${task.company._id}`} className="text-xs text-gray-400 hover:text-indigo-600">
                {task.company.name}
              </Link>
            )}
            {task.contact && (
              <Link href={`/dashboard/crm/contacts/${task.contact._id}`} className="text-xs text-gray-400 hover:text-indigo-600">
                {task.contact.firstName} {task.contact.lastName}
              </Link>
            )}
          </div>
        </div>

        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
          {task.assignedTo?.name}
        </span>
      </div>
    );
  };

  const Section = ({ title, items, badge, badgeColor = "bg-gray-100 text-gray-600" }) => {
    if (items.length === 0) return null;
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {items.length}
          </span>
        </div>
        {items.map((task) => <TaskRow key={task._id} task={task} />)}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">{t("crm.tasks.title")}</h1>
        <div className="flex items-center gap-2">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("crm.filters.allUsers")}</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("common.all")}</option>
            <option value="not-started">{t("crm.tasks.status.not-started")}</option>
            <option value="in-progress">{t("crm.tasks.status.in-progress")}</option>
            <option value="completed">{t("crm.tasks.status.completed")}</option>
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <PlusIcon className="h-4 w-4" />
            {t("crm.tasks.newTask")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <CheckCircleIcon className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">{t("crm.tasks.noTasks")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("crm.tasks.noTasksDesc")}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <PlusIcon className="h-4 w-4" />
              {t("crm.tasks.newTask")}
            </button>
          </div>
        ) : (
          <>
            <Section
              title={t("crm.tasks.sections.overdue")}
              items={overdue}
              badgeColor="bg-red-100 text-red-700"
            />
            <Section
              title={t("crm.tasks.sections.upcoming")}
              items={upcoming}
              badgeColor="bg-blue-100 text-blue-700"
            />
            <Section
              title={t("crm.tasks.sections.completed")}
              items={completed}
              badgeColor="bg-green-100 text-green-700"
            />
          </>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
