"use client";

import { useState, useEffect, use } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  PlusIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import CreateTaskModal from "@/components/crm/CreateTaskModal";
import CreateDealModal from "@/components/crm/CreateDealModal";
import CreateContactModal from "@/components/crm/CreateContactModal";
import CreateCallModal from "@/components/crm/CreateCallModal";
import CreateMeetingModal from "@/components/crm/CreateMeetingModal";
import EditCompanyModal from "@/components/crm/EditCompanyModal";
import EditMeetingModal from "@/components/crm/EditMeetingModal";
import EditCallModal from "@/components/crm/EditCallModal";
import EditTaskModal from "@/components/crm/EditTaskModal";
import CallItem from "@/components/crm/CallItem";
import MeetingItem from "@/components/crm/MeetingItem";
import TaskItem from "@/components/crm/TaskItem";
import ActivityItem from "@/components/crm/ActivityItem";

const OUTREACH_STATUS_STYLES = {
  contacted:      { cls: "bg-blue-50 text-blue-600",   icon: "📧", short: "Lähetetty" },
  interested:     { cls: "bg-green-50 text-green-700", icon: "✅", short: "Kiinnostunut" },
  not_interested: { cls: "bg-gray-100 text-gray-400",  icon: "✗",  short: "Ei kiinnostunut" },
  bounced:        { cls: "bg-red-50 text-red-500",     icon: "⚠️", short: "Bounce" },
  replied:        { cls: "bg-teal-50 text-teal-700",   icon: "💬", short: "Vastannut" },
  unsubscribed:   { cls: "bg-yellow-50 text-yellow-700",icon: "🚫", short: "Peruuttanut" },
};

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

const DEAL_STAGE_COLORS = {
  "appointment-scheduled": "bg-blue-100 text-blue-700",
  "follow-up": "bg-indigo-100 text-indigo-700",
  "waiting-offer": "bg-purple-100 text-purple-700",
  "offer-sent": "bg-orange-100 text-orange-700",
  "contract-sent": "bg-yellow-100 text-yellow-700",
  "closed-won": "bg-green-100 text-green-700",
  "closed-lost": "bg-red-100 text-red-700",
};

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

export default function CompanyDetailClient({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { t } = useI18n();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Modals
  const [showTask, setShowTask] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingPrefill, setMeetingPrefill] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editingCall, setEditingCall] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Google integration
  const [gmailMessages, setGmailMessages] = useState(null); // null = not fetched
  const [calendarEvents, setCalendarEvents] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/crm/companies/${id}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Inline field editing
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/crm/users")
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  const startEdit = (field, rawValue) => { setEditing(field); setEditVal(rawValue ?? ""); };
  const cancelEdit = () => { setEditing(null); setEditVal(""); };

  const saveFieldCompany = async (field, value) => {
    if (saving) return;
    setSaving(true);
    const finalValue = (field === "owner" && !value) ? null : value;
    try {
      await fetch(`/api/crm/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: finalValue }),
      });
      setEditing(null);
      setEditVal("");
      fetchData();
      toast.success(t("crm.companies.edit.success"));
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Fetch Google connection status once
  useEffect(() => {
    fetch("/api/integrations/google/status")
      .then(r => r.json())
      .then(d => setGoogleConnected(d.connected))
      .catch(() => {});
  }, []);

  // Fetch Gmail when data + google status are ready (used by activity feed, emails tab, right sidebar)
  useEffect(() => {
    if (gmailMessages !== null || !data || !googleConnected) return;
    const emails = new Set();
    (data.contacts || []).forEach(c => { if (c.email) emails.add(c.email); });
    if (data.company?.email) emails.add(data.company.email);
    if (emails.size === 0) { setGmailMessages([]); return; }
    fetch(`/api/integrations/gmail?emails=${encodeURIComponent([...emails].join(","))}`)
      .then(r => r.json())
      .then(d => setGmailMessages(d.messages || []))
      .catch(() => setGmailMessages([]));
  }, [data, gmailMessages, googleConnected]);

  // Fetch Calendar events, sync them to DB as CRM meetings, then reload
  useEffect(() => {
    if ((activeTab !== "meetings" && activeTab !== "activity") || calendarEvents !== null || !data || !googleConnected) return;
    const emails = new Set();
    (data.contacts || []).forEach(c => { if (c.email) emails.add(c.email); });
    if (data.company?.email) emails.add(data.company.email);
    const param = emails.size > 0
      ? `emails=${encodeURIComponent([...emails].join(","))}`
      : `q=${encodeURIComponent(data.company?.name || "")}`;
    fetch(`/api/integrations/calendar?${param}`)
      .then(r => r.json())
      .then(async d => {
        const events = d.events || [];
        setCalendarEvents([]); // mark as fetched (empty — events go to DB now)
        if (events.length > 0) {
          await fetch("/api/crm/meetings/sync-calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company: id, events }),
          });
          fetchData(); // reload so synced meetings appear in the feed
        }
      })
      .catch(() => setCalendarEvents([]));
  }, [activeTab, data, calendarEvents, googleConnected]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await fetch("/api/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", content: noteText, company: id }),
      });
      setNoteText("");
      fetchData();
      toast.success(t("crm.activities.saveNote"));
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleTaskCreated = (task) => {
    setShowTask(false);
    fetchData();
    toast.success(t("crm.tasks.create.success"));
  };

  const handleDealCreated = (deal) => {
    setShowDeal(false);
    fetchData();
    toast.success(t("crm.deals.create.success"));
  };

  const handleContactCreated = () => {
    setShowContact(false);
    fetchData();
    toast.success(t("crm.contacts.create.success"));
  };

  const handleCallCreated = () => {
    setShowCall(false);
    fetchData();
    toast.success(t("crm.calls.create.success"));
  };

  const handleMeetingCreated = () => {
    setShowMeeting(false);
    fetchData();
    toast.success(t("crm.meetings.create.success"));
  };

  const handleCompanyUpdated = (updatedCompany) => {
    setData((prev) => ({ ...prev, company: updatedCompany }));
    setShowEdit(false);
    toast.success(t("crm.companies.edit.success"));
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "not-started" : "completed";
    try {
      await fetch(`/api/crm/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await fetch(`/api/crm/activities/${activityId}`, { method: "DELETE" });
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleDeleteCall = async (callId) => {
    try {
      await fetch(`/api/crm/calls/${callId}`, { method: "DELETE" });
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await fetch(`/api/crm/meetings/${meetingId}`, { method: "DELETE" });
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`/api/crm/tasks/${taskId}`, { method: "DELETE" });
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleUpdatedActivity = (updated) => {
    setData(prev => ({
      ...prev,
      activities: (prev.activities || []).map(a => a._id === updated._id ? { ...a, ...updated } : a),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data?.company) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">Company not found</p>
        <Link href="/dashboard/crm/companies" className="mt-4 text-indigo-600 hover:underline text-sm">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const { company, contacts = [], deals = [], tasks = [], activities = [], meetings = [], calls = [] } = data;

  const tabs = [
    { key: "activity", label: t("crm.company.tabs.activity") },
    { key: "notes", label: t("crm.company.tabs.notes") },
    { key: "emails", label: t("crm.company.tabs.emails") },
    { key: "calls", label: t("crm.company.tabs.calls") },
    { key: "tasks", label: t("crm.company.tabs.tasks") },
    { key: "meetings", label: t("crm.company.tabs.meetings") },
  ];

  const typeMap = { notes: "note", calls: "call", tasks: "task", meetings: "meeting" };
  const filteredActivities = activities.filter(a => a.type === (typeMap[activeTab] || activeTab));

  // Unified feed for the activity tab (CRM activities + CRM meetings + Gmail)
  // Google Calendar events are synced to CRM meetings on fetch, so no separate calendar type
  const unifiedFeed = [
    ...activities.map(a => ({ ...a, _type: "activity", _date: new Date(a.createdAt) })),
    ...meetings.map(m => ({ ...m, _type: "crm-meeting", _date: new Date(m.meetingDate) })),
    ...calls.map(c => ({ ...c, _type: "crm-call", _date: new Date(c.callDate) })),
    ...(gmailMessages || []).map(m => ({ ...m, _type: "email", _date: new Date(m.date) })),
  ].sort((a, b) => b._date - a._date);

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
  );
  const upcomingTasks = tasks.filter(
    (t) => t.status !== "completed" && (!t.dueDate || new Date(t.dueDate) >= new Date())
  );

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <Link
            href="/dashboard/crm/companies"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t("crm.sidebar.companies")}
          </Link>

          <div className="flex items-start gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-lg font-bold text-indigo-700">
                {company.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {/* Editable company name */}
              {editing === "name" ? (
                <input
                  type="text"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveFieldCompany("name", editVal); if (e.key === "Escape") cancelEdit(); }}
                  onBlur={() => saveFieldCompany("name", editVal)}
                  autoFocus
                  className="text-sm font-semibold w-full border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <button onClick={() => startEdit("name", company.name)} className="group/name flex items-center gap-1 text-left w-full">
                  <h2 className="font-semibold text-gray-900 text-sm truncate">{company.name}</h2>
                  <PencilIcon className="h-3 w-3 text-gray-300 group-hover/name:text-indigo-400 flex-shrink-0" />
                </button>
              )}
              {/* Editable website */}
              {editing === "website" ? (
                <input
                  type="text"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveFieldCompany("website", editVal); if (e.key === "Escape") cancelEdit(); }}
                  onBlur={() => saveFieldCompany("website", editVal)}
                  autoFocus
                  placeholder="https://..."
                  className="text-xs w-full border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-0.5"
                />
              ) : (
                <button onClick={() => startEdit("website", company.website)} className="group/site flex items-center gap-1 text-left mt-0.5">
                  <GlobeAltIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-indigo-600 truncate max-w-[160px]">
                    {company.website ? company.website.replace(/^https?:\/\//, "") : <span className="text-gray-300">—</span>}
                  </span>
                  <PencilIcon className="h-3 w-3 text-gray-300 group-hover/site:text-indigo-400 flex-shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* About section — editable */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            {t("crm.company.about")}
          </h3>

          <div className="space-y-2">
            {[
              { key: "phone",          label: t("common.phone"),                          type: "tel" },
              { key: "email",          label: t("common.email"),                          type: "email" },
              { key: "businessId",     label: t("crm.companies.fields.businessId"),       type: "text" },
              { key: "lifecycleStage", label: t("crm.companies.fields.lifecycleStage"),   type: "select",
                options: ["lead","prospect","opportunity","customer","evangelist","other"].map(v => ({ value: v, label: t(`crm.lifecycleStage.${v}`) })) },
              { key: "industry",       label: t("crm.companies.fields.industry"),         type: "text" },
              { key: "size",           label: t("crm.companies.fields.size"),             type: "select",
                options: ["1-10","11-50","51-200","201-500","501-1000","1000+"].map(v => ({ value: v, label: v })) },
              { key: "owner",          label: t("common.owner"),                          type: "select",
                options: users.map(u => ({ value: u._id, label: u.name || u.email })) },
              { key: "linkedinUrl",    label: "LinkedIn",                                 type: "text" },
            ].map(({ key, label, type, options }) => {
              const isEditing = editing === key;
              let displayValue = company[key];
              if (key === "owner") displayValue = company.owner?.name;
              else if (key === "lifecycleStage" && displayValue) displayValue = t(`crm.lifecycleStage.${displayValue}`);
              // size uses raw value as-is

              return (
                <div key={key} className="flex justify-between gap-2 items-start group">
                  <span className="text-gray-500 text-xs flex-shrink-0 mt-1">{label}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      {type === "select" ? (
                        <select
                          value={editVal}
                          onChange={e => { setEditVal(e.target.value); saveFieldCompany(key, e.target.value); }}
                          onKeyDown={e => { if (e.key === "Escape") cancelEdit(); }}
                          autoFocus
                          className="text-xs border border-indigo-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[150px]"
                        >
                          <option value="">{key === "owner" ? "Ei omistajaa" : "—"}</option>
                          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input
                          type={type}
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveFieldCompany(key, editVal); if (e.key === "Escape") cancelEdit(); }}
                          onBlur={() => saveFieldCompany(key, editVal)}
                          autoFocus
                          className="text-xs border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-[150px]"
                        />
                      )}
                      <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(key, key === "owner" ? (company.owner?._id || "") : (company[key] || ""))}
                      className="flex items-center gap-1 text-xs text-gray-800 text-right max-w-[160px] group/field"
                    >
                      <span className="truncate">{displayValue || <span className="text-gray-300">—</span>}</span>
                      <PencilIcon className="h-3 w-3 text-gray-300 group-hover/field:text-indigo-400 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Action buttons strip */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
          {[
            { key: "note", icon: ChatBubbleLeftIcon, action: () => setActiveTab("notes") },
            { key: "email", icon: EnvelopeIcon, action: () => {} },
            { key: "call", icon: PhoneIcon, action: () => setShowCall(true) },
            { key: "task", icon: CheckIcon, action: () => setShowTask(true) },
            { key: "meeting", icon: UserIcon, action: () => setShowMeeting(true) },
          ].map(({ key, icon: Icon, action }) => (
            <button
              key={key}
              onClick={action}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm text-gray-600 hover:text-indigo-700 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {t(`crm.company.actions.${key}`)}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Tab-specific add button for calls and tasks */}
          {activeTab === "calls" && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCall(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                <PlusIcon className="h-4 w-4" />
                {t("crm.calls.newCall")}
              </button>
            </div>
          )}
          {activeTab === "tasks" && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowTask(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                <PlusIcon className="h-4 w-4" />
                {t("crm.tasks.newTask")}
              </button>
            </div>
          )}
          {activeTab === "meetings" && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowMeeting(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                <PlusIcon className="h-4 w-4" />
                {t("crm.meetings.newMeeting")}
              </button>
            </div>
          )}

          {/* Note input */}
          {(activeTab === "activity" || activeTab === "notes") && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t("crm.activities.notePlaceholder")}
                rows={3}
                className="w-full text-sm text-gray-700 resize-none focus:outline-none"
              />
              {noteText.trim() && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {savingNote ? t("common.loading") : t("crm.activities.saveNote")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tasks section (shown on activity tab) */}
          {activeTab === "activity" && tasks.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">{t("crm.tasks.sections.upcoming")}</h3>
                <button
                  onClick={() => setShowTask(true)}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <PlusIcon className="h-3 w-3" />
                  {t("crm.tasks.newTask")}
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {[...overdueTasks.slice(0, 3), ...upcomingTasks.slice(0, 3)].map((task) => {
                  const isOverdue =
                    task.status !== "completed" &&
                    task.dueDate &&
                    new Date(task.dueDate) < new Date();
                  return (
                    <div key={task._id} className="flex items-start gap-3 px-4 py-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          task.status === "completed"
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-indigo-500"
                        }`}
                      >
                        {task.status === "completed" && (
                          <CheckIcon className="h-2.5 w-2.5 text-white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                            {isOverdue ? t("crm.tasks.sections.overdue") + " · " : ""}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{task.assignedTo?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emails tab */}
          {activeTab === "emails" && (
            <div className="space-y-2">
              {!googleConnected ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">{t("crm.integrations.google.connectPrompt")}</p>
                  <a href="/dashboard/crm/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium">
                    {t("crm.integrations.google.connect")}
                  </a>
                </div>
              ) : gmailMessages === null ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.integrations.google.noEmails")}</div>
              ) : (
                gmailMessages.map(msg => (
                  <div key={msg.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{msg.subject}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{new Date(msg.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{msg.from}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{msg.snippet}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Unified activity feed (activity tab) */}
          {activeTab === "activity" && (
            unifiedFeed.length === 0 && !googleConnected ? (
              <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
            ) : unifiedFeed.length === 0 && gmailMessages === null ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : unifiedFeed.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
            ) : (
              <div className="space-y-3">
                {unifiedFeed.map((item) => {
                  if (item._type === "email") return (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">✉️</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">{item.subject}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{item._date.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.from}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.snippet}</p>
                        </div>
                      </div>
                    </div>
                  );
                  if (item._type === "crm-meeting") return (
                    <MeetingItem key={item._id} meeting={item}
                      onEdit={setEditingMeeting}
                      onDelete={handleDeleteMeeting}
                    />
                  );
                  if (item._type === "crm-call") return (
                    <CallItem key={item._id} call={item}
                      onEdit={setEditingCall}
                      onDelete={handleDeleteCall}
                    />
                  );

                  return (
                    <ActivityItem key={item._id} activity={item}
                      onDelete={handleDeleteActivity}
                      onUpdated={handleUpdatedActivity}
                    />
                  );
                })}
              </div>
            )
          )}

          {/* Notes tab */}
          {activeTab === "notes" && (
            filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map(activity => (
                  <ActivityItem key={activity._id} activity={activity}
                    onDelete={handleDeleteActivity}
                    onUpdated={handleUpdatedActivity}
                  />
                ))}
              </div>
            )
          )}

          {/* Calls tab */}
          {activeTab === "calls" && (
            calls.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
            ) : (
              <div className="space-y-3">
                {calls.map(call => (
                  <CallItem key={call._id} call={call}
                    onEdit={setEditingCall}
                    onDelete={handleDeleteCall}
                  />
                ))}
              </div>
            )
          )}

          {/* Tasks tab */}
          {activeTab === "tasks" && (
            tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <TaskItem key={task._id} task={task}
                    onToggle={handleToggleTask}
                    onEdit={setEditingTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )
          )}

          {/* Meetings tab */}
          {activeTab === "meetings" && (
            <div className="space-y-3">
              {meetings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              ) : meetings.map(m => (
                <MeetingItem key={m._id} meeting={m}
                  onEdit={setEditingMeeting}
                  onDelete={handleDeleteMeeting}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
        {/* Contacts */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("crm.company.contacts")} ({contacts.length})
            </h3>
            <button
              onClick={() => setShowContact(true)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title={t("crm.company.addContact")}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {contacts.length === 0 ? (
            <button
              onClick={() => setShowContact(true)}
              className="w-full text-sm text-indigo-600 hover:underline text-left"
            >
              + {t("crm.company.addContact")}
            </button>
          ) : (
            <div className="space-y-3">
              {contacts.slice(0, 5).map((contact) => {
                const outreach = contact.outreachStatus ? OUTREACH_STATUS_STYLES[contact.outreachStatus] : null;
                return (
                  <div key={contact._id} className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-red-700">
                        {contact.firstName?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/dashboard/crm/contacts/${contact._id}`}
                          className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        {outreach && (
                          <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${outreach.cls}`}>
                            <span className="text-xs">{outreach.icon}</span>
                            {outreach.short}
                          </span>
                        )}
                      </div>
                      {contact.jobTitle && (
                        <p className="text-xs text-gray-500 truncate">{contact.jobTitle}</p>
                      )}
                      {contact.email && (
                        <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {contacts.length > 5 && (
                <p className="text-xs text-indigo-600 hover:underline cursor-pointer">
                  {t("crm.company.viewAllContacts")}
                </p>
              )}
              {/* Outreach summary */}
              {contacts.some(c => c.outreachStatus) && (() => {
                const interested = contacts.filter(c => c.outreachStatus === "interested").length;
                const contacted = contacts.filter(c => c.outreachStatus === "contacted").length;
                const notInterested = contacts.filter(c => c.outreachStatus === "not_interested").length;
                const bounced = contacts.filter(c => c.outreachStatus === "bounced").length;
                return (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {interested > 0 && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">✅ {interested}</span>}
                    {contacted > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">📧 {contacted}</span>}
                    {notInterested > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">✗ {notInterested}</span>}
                    {bounced > 0 && <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">⚠️ {bounced}</span>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Emails (Gmail) */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("crm.company.tabs.emails")}{gmailMessages ? ` (${gmailMessages.length})` : ""}
            </h3>
            {gmailMessages?.length > 0 && (
              <button onClick={() => setActiveTab("emails")} className="text-xs text-indigo-600 hover:underline">
                {t("crm.company.viewAll")}
              </button>
            )}
          </div>
          {!googleConnected ? (
            <a href="/dashboard/crm/settings" className="text-xs text-indigo-600 hover:underline">
              {t("crm.integrations.google.connect")}
            </a>
          ) : gmailMessages === null ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full" />
              <span className="text-xs text-gray-400">{t("common.loading")}</span>
            </div>
          ) : gmailMessages.length === 0 ? (
            <p className="text-xs text-gray-400">{t("crm.integrations.google.noEmails")}</p>
          ) : (
            <div className="space-y-2">
              {gmailMessages.slice(0, 3).map(msg => (
                <button key={msg.id} onClick={() => setActiveTab("emails")} className="w-full text-left group">
                  <div className="rounded-lg border border-gray-100 p-2.5 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                    <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-700">{msg.subject}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{msg.from?.split("<")[0].trim()}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(msg.date).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
              {gmailMessages.length > 3 && (
                <button onClick={() => setActiveTab("emails")} className="text-xs text-indigo-600 hover:underline w-full text-left">
                  +{gmailMessages.length - 3} {t("crm.company.viewAllEmails")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Deals */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("crm.company.deals")} ({deals.length})
            </h3>
            <button
              onClick={() => setShowDeal(true)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title={t("crm.company.addDeal")}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {deals.length === 0 ? (
            <button
              onClick={() => setShowDeal(true)}
              className="w-full text-sm text-indigo-600 hover:underline text-left"
            >
              + {t("crm.company.addDeal")}
            </button>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => (
                <div key={deal._id} className="border border-gray-200 rounded-lg p-3">
                  <Link
                    href={`/dashboard/crm/deals/${deal._id}`}
                    className="text-sm font-medium text-gray-800 hover:text-indigo-600 block truncate"
                  >
                    {deal.title}
                  </Link>
                  {deal.amount !== undefined && deal.amount !== null && (
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      €{deal.amount?.toLocaleString()}
                    </p>
                  )}
                  {deal.closeDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(deal.closeDate).toLocaleDateString()}
                    </p>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1.5 ${
                      DEAL_STAGE_COLORS[deal.stage] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t(`crm.deals.stages.${deal.stage}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTask && (
        <CreateTaskModal
          companyId={id}
          companyName={company.name}
          onClose={() => setShowTask(false)}
          onCreated={handleTaskCreated}
        />
      )}
      {showDeal && (
        <CreateDealModal
          companyId={id}
          companyName={company.name}
          onClose={() => setShowDeal(false)}
          onCreated={handleDealCreated}
        />
      )}
      {showContact && (
        <CreateContactModal
          companyId={id}
          companyName={company.name}
          onClose={() => setShowContact(false)}
          onCreated={handleContactCreated}
        />
      )}
      {showCall && (
        <CreateCallModal
          companyId={id}
          companyName={company.name}
          onClose={() => setShowCall(false)}
          onCreated={handleCallCreated}
        />
      )}
      {showMeeting && (
        <CreateMeetingModal
          companyId={id}
          companyName={company.name}
          initial={meetingPrefill}
          onClose={() => { setShowMeeting(false); setMeetingPrefill(null); }}
          onCreated={handleMeetingCreated}
        />
      )}
      {showEdit && (
        <EditCompanyModal
          company={company}
          onClose={() => setShowEdit(false)}
          onUpdated={handleCompanyUpdated}
        />
      )}
      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
          onUpdated={() => { setEditingMeeting(null); fetchData(); toast.success(t("crm.meetings.edit.success")); }}
        />
      )}
      {editingCall && (
        <EditCallModal
          call={editingCall}
          onClose={() => setEditingCall(null)}
          onUpdated={() => { setEditingCall(null); fetchData(); toast.success(t("crm.calls.edit.success")); }}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={() => { setEditingTask(null); fetchData(); toast.success(t("crm.tasks.edit.success")); }}
        />
      )}
    </div>
  );
}
