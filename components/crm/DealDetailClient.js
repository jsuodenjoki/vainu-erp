"use client";

import { useState, useEffect, useRef, use } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import CreateTaskModal from "@/components/crm/CreateTaskModal";
import CreateMeetingModal from "@/components/crm/CreateMeetingModal";
import CreateCallModal from "@/components/crm/CreateCallModal";

const STAGE_COLORS = {
  "appointment-scheduled": "bg-blue-100 text-blue-700",
  "qualified-to-buy": "bg-indigo-100 text-indigo-700",
  "presentation-scheduled": "bg-purple-100 text-purple-700",
  "decision-maker-bought-in": "bg-orange-100 text-orange-700",
  "contract-sent": "bg-yellow-100 text-yellow-700",
  "closed-won": "bg-green-100 text-green-700",
  "closed-lost": "bg-red-100 text-red-700",
};

const OUTCOME_COLORS = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  "no-show": "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
  rescheduled: "bg-yellow-100 text-yellow-700",
};

const CALL_OUTCOME_COLORS = {
  connected: "bg-green-100 text-green-700",
  "left-voicemail": "bg-blue-100 text-blue-700",
  "no-answer": "bg-gray-100 text-gray-600",
  busy: "bg-yellow-100 text-yellow-700",
  "wrong-number": "bg-red-100 text-red-700",
};

export default function DealDetailClient({ params }) {
  const { id } = use(params);
  const { t } = useI18n();
  const [deal, setDeal] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [calls, setCalls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState([]);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const contactSearchRef = useRef(null);

  const fetchData = async () => {
    try {
      const [dealRes, meetingsRes, tasksRes] = await Promise.all([
        fetch(`/api/crm/deals/${id}`),
        fetch(`/api/crm/meetings?deal=${id}`),
        fetch(`/api/crm/tasks?deal=${id}`),
      ]);
      const dealData = await dealRes.json();
      const meetingsData = await meetingsRes.json();
      const tasksData = await tasksRes.json();
      setDeal(dealData.deal);
      setMeetings(meetingsData.meetings || []);
      setTasks(tasksData.tasks || []);
    } catch {
      toast.error("Failed to load deal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Fetch calls on calls tab
  useEffect(() => {
    if (activeTab !== "calls" || calls !== null) return;
    fetch(`/api/crm/calls?deal=${id}`)
      .then(r => r.json())
      .then(d => setCalls(d.calls || []))
      .catch(() => setCalls([]));
  }, [activeTab, calls, id]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await fetch("/api/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", content: noteText, deal: id }),
      });
      setNoteText("");
      toast.success(t("crm.activities.saveNote"));
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
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

  // Search contacts when typing
  useEffect(() => {
    if (!contactSearch.trim()) { setContactResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/crm/contacts?search=${encodeURIComponent(contactSearch)}&limit=10`)
        .then(r => r.json())
        .then(d => setContactResults(d.contacts || []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [contactSearch]);

  // Close contact search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (contactSearchRef.current && !contactSearchRef.current.contains(e.target)) {
        setShowContactSearch(false);
        setContactSearch("");
        setContactResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddContact = async (contact) => {
    const existing = deal.contacts || [];
    if (existing.find(c => c._id === contact._id)) return;
    const newIds = [...existing.map(c => c._id), contact._id];
    try {
      const res = await fetch(`/api/crm/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: newIds }),
      });
      const data = await res.json();
      setDeal(data.deal);
      setContactSearch("");
      setContactResults([]);
      setShowContactSearch(false);
    } catch {
      toast.error("Failed to add contact");
    }
  };

  const handleRemoveContact = async (contactId) => {
    const newIds = (deal.contacts || []).filter(c => c._id !== contactId).map(c => c._id);
    try {
      const res = await fetch(`/api/crm/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: newIds }),
      });
      const data = await res.json();
      setDeal(data.deal);
    } catch {
      toast.error("Failed to remove contact");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!deal) return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-gray-500">Deal not found</p>
      <Link href="/dashboard/crm/deals" className="mt-4 text-indigo-600 hover:underline text-sm">{t("common.back")}</Link>
    </div>
  );

  const tabs = [
    { key: "overview", label: t("crm.deal.tabs.overview") },
    { key: "meetings", label: t("crm.deal.tabs.meetings") },
    { key: "calls", label: t("crm.company.tabs.calls") },
    { key: "tasks", label: t("crm.deal.tabs.tasks") },
    { key: "notes", label: t("crm.deal.tabs.notes") },
  ];

  const upcomingMeetings = meetings.filter(m => m.outcome === "scheduled");

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* Left panel — deal info */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <Link
            href={deal.company ? `/dashboard/crm/companies/${deal.company._id}` : "/dashboard/crm/deals"}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {deal.company ? deal.company.name : t("crm.sidebar.deals")}
          </Link>

          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-indigo-700">€</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 leading-tight">{deal.title}</h2>
              {deal.company && (
                <Link href={`/dashboard/crm/companies/${deal.company._id}`} className="text-xs text-indigo-600 hover:underline">
                  {deal.company.name}
                </Link>
              )}
            </div>
          </div>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || "bg-gray-100 text-gray-600"}`}>
            {t(`crm.deals.stages.${deal.stage}`)}
          </span>
        </div>

        <div className="p-4 space-y-2 text-sm">
          {[
            { label: t("crm.deals.fields.amount"), value: deal.amount != null ? `€${deal.amount.toLocaleString()}` : null },
            { label: t("crm.deals.fields.closeDate"), value: deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : null },
            { label: t("crm.deals.fields.probability"), value: deal.probability != null ? `${deal.probability}%` : null },
            { label: t("common.owner"), value: deal.owner?.name },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
              <span className="text-gray-800 text-xs text-right truncate">
                {value || <span className="text-gray-300">—</span>}
              </span>
            </div>
          ))}
          {deal.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">{deal.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Center panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Action buttons */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
          {[
            { key: "note", icon: ChatBubbleLeftIcon, action: () => setActiveTab("notes") },
            { key: "call", icon: PhoneIcon, action: () => setShowCall(true) },
            { key: "task", icon: CheckIcon, action: () => setShowTask(true) },
            { key: "meeting", icon: UserIcon, action: () => setShowMeeting(true) },
          ].map(({ key, icon: Icon, action }) => (
            <button key={key} onClick={action}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm text-gray-600 hover:text-indigo-700 transition-colors">
              <Icon className="h-4 w-4" />
              {t(`crm.company.actions.${key}`)}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Overview tab */}
          {activeTab === "overview" && (
            <>
              {upcomingMeetings.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">{t("crm.deal.upcomingMeetings")}</h3>
                    <button onClick={() => setActiveTab("meetings")} className="text-xs text-indigo-600 hover:underline">
                      {t("crm.company.viewAll")}
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {upcomingMeetings.slice(0, 3).map(m => (
                      <div key={m._id} className="flex items-start gap-3 px-4 py-3">
                        <span className="text-base mt-0.5 flex-shrink-0">📅</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{m.title || t(`crm.meetings.subtype.${m.subtype || "other"}`)}</p>
                          <p className="text-xs text-gray-400">{new Date(m.meetingDate).toLocaleString()}</p>
                          {m.contacts?.length > 0 && (
                            <p className="text-xs text-gray-400">{m.contacts.map(c => `${c.firstName} ${c.lastName}`).join(", ")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.filter(t => t.status !== "completed").length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">{t("crm.tasks.sections.upcoming")}</h3>
                    <button onClick={() => setShowTask(true)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                      <PlusIcon className="h-3 w-3" />
                      {t("crm.tasks.newTask")}
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {tasks.filter(t => t.status !== "completed").slice(0, 5).map(task => (
                      <div key={task._id} className="flex items-start gap-3 px-4 py-3">
                        <button onClick={() => handleToggleTask(task)}
                          className="mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center border-gray-300 hover:border-indigo-500">
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{task.title}</p>
                          {task.dueDate && (
                            <p className={`text-xs mt-0.5 ${new Date(task.dueDate) < new Date() ? "text-red-500" : "text-gray-400"}`}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upcomingMeetings.length === 0 && tasks.filter(t => t.status !== "completed").length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              )}
            </>
          )}

          {/* Meetings tab */}
          {activeTab === "meetings" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setShowMeeting(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <PlusIcon className="h-4 w-4" />
                  {t("crm.meetings.newMeeting")}
                </button>
              </div>
              {meetings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              ) : (
                meetings.map(m => (
                  <div key={m._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">📅</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {m.title || t(`crm.meetings.subtype.${m.subtype || "other"}`)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t(`crm.meetings.subtype.${m.subtype || "other"}`)} · {t(`crm.meetings.type.${m.type}`)}
                              {m.duration ? ` · ${m.duration} min` : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400">{new Date(m.meetingDate).toLocaleString()}</span>
                            {m.outcome && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${OUTCOME_COLORS[m.outcome] || "bg-gray-100 text-gray-600"}`}>
                                {t(`crm.meetings.outcome.${m.outcome}`)}
                              </span>
                            )}
                          </div>
                        </div>
                        {m.contacts?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.contacts.map(c => (
                              <Link key={c._id} href={`/dashboard/crm/contacts/${c._id}`}
                                className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-0.5 rounded-full">
                                {c.firstName} {c.lastName}
                              </Link>
                            ))}
                          </div>
                        )}
                        {m.notes && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{m.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Calls tab */}
          {activeTab === "calls" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setShowCall(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <PlusIcon className="h-4 w-4" />
                  {t("crm.calls.newCall")}
                </button>
              </div>
              {calls === null ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              ) : (
                calls.map(call => (
                  <div key={call._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">📞</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">
                            {call.title || t(`crm.calls.direction.${call.direction}`)}
                          </p>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400">{new Date(call.callDate).toLocaleString()}</span>
                            {call.outcome && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CALL_OUTCOME_COLORS[call.outcome] || "bg-gray-100 text-gray-600"}`}>
                                {t(`crm.calls.outcome.${call.outcome}`)}
                              </span>
                            )}
                          </div>
                        </div>
                        {call.duration > 0 && <p className="text-xs text-gray-400 mt-0.5">{call.duration} min</p>}
                        {call.contacts?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {call.contacts.map(c => (
                              <Link key={c._id} href={`/dashboard/crm/contacts/${c._id}`}
                                className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-0.5 rounded-full">
                                {c.firstName} {c.lastName}
                              </Link>
                            ))}
                          </div>
                        )}
                        {call.notes && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{call.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tasks tab */}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setShowTask(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <PlusIcon className="h-4 w-4" />
                  {t("crm.tasks.newTask")}
                </button>
              </div>
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              ) : (
                tasks.map(task => {
                  const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div key={task._id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
                      <button onClick={() => handleToggleTask(task)}
                        className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          task.status === "completed" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-indigo-500"
                        }`}>
                        {task.status === "completed" && <CheckIcon className="h-2.5 w-2.5 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
                        {task.dueDate && (
                          <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {task.contacts?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {task.contacts.map(c => (
                              <Link key={c._id} href={`/dashboard/crm/contacts/${c._id}`}
                                className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-0.5 rounded-full">
                                {c.firstName} {c.lastName}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{task.assignedTo?.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Notes tab */}
          {activeTab === "notes" && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder={t("crm.activities.notePlaceholder")} rows={3}
                className="w-full text-sm text-gray-700 resize-none focus:outline-none" />
              {noteText.trim() && (
                <div className="flex justify-end mt-2">
                  <button onClick={handleSaveNote} disabled={savingNote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50">
                    {savingNote ? t("common.loading") : t("crm.activities.saveNote")}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right panel — contacts + deal stats */}
      <div className="w-64 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
        {/* Contacts */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("crm.company.contacts")} ({deal.contacts?.length || 0})
            </h3>
            <button
              onClick={() => setShowContactSearch(v => !v)}
              className="text-indigo-600 hover:text-indigo-800"
              title={t("crm.contacts.addContact")}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Inline contact search */}
          {showContactSearch && (
            <div className="mb-3 relative" ref={contactSearchRef}>
              <input
                autoFocus
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder={t("common.search") + "..."}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"
              />
              {contactResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                  {contactResults
                    .filter(c => !(deal.contacts || []).find(dc => dc._id === c._id))
                    .map(c => (
                      <button
                        key={c._id}
                        onMouseDown={() => handleAddContact(c)}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-xs flex items-center gap-2"
                      >
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-red-700">{c.firstName?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-gray-800">{c.firstName} {c.lastName}</span>
                        {c.jobTitle && <span className="text-gray-400 truncate">{c.jobTitle}</span>}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {deal.contacts?.length > 0 ? (
            <div className="space-y-2">
              {deal.contacts.map(contact => (
                <div key={contact._id} className="flex items-center gap-2 group">
                  <Link href={`/dashboard/crm/contacts/${contact._id}`} className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-red-700">{contact.firstName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.jobTitle && <p className="text-xs text-gray-400 truncate">{contact.jobTitle}</p>}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveContact(contact._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity flex-shrink-0"
                    title={t("common.remove")}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">–</p>
          )}
        </div>

        {/* Meetings summary */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("crm.company.tabs.meetings")} ({meetings.length})
            </h3>
            {meetings.length > 0 && (
              <button onClick={() => setActiveTab("meetings")} className="text-xs text-indigo-600 hover:underline">
                {t("crm.company.viewAll")}
              </button>
            )}
          </div>
          {meetings.length === 0 ? (
            <button onClick={() => setShowMeeting(true)} className="text-xs text-indigo-600 hover:underline">
              + {t("crm.meetings.newMeeting")}
            </button>
          ) : (
            <div className="space-y-2">
              {meetings.slice(0, 3).map(m => (
                <div key={m._id} className="text-xs">
                  <p className="font-medium text-gray-700 truncate">
                    {m.title || t(`crm.meetings.subtype.${m.subtype || "other"}`)}
                  </p>
                  <p className="text-gray-400">{new Date(m.meetingDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks summary */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("crm.company.tabs.tasks")} ({tasks.filter(t => t.status !== "completed").length})
            </h3>
          </div>
          {tasks.filter(t => t.status !== "completed").length === 0 ? (
            <button onClick={() => setShowTask(true)} className="text-xs text-indigo-600 hover:underline">
              + {t("crm.tasks.newTask")}
            </button>
          ) : (
            <div className="space-y-1.5">
              {tasks.filter(t => t.status !== "completed").slice(0, 4).map(task => (
                <p key={task._id} className="text-xs text-gray-600 truncate">• {task.title}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTask && (
        <CreateTaskModal
          dealId={id}
          companyId={deal.company?._id}
          companyName={deal.company?.name}
          onClose={() => setShowTask(false)}
          onCreated={() => { setShowTask(false); fetchData(); }}
        />
      )}
      {showMeeting && (
        <CreateMeetingModal
          dealId={id}
          companyId={deal.company?._id}
          companyName={deal.company?.name}
          onClose={() => setShowMeeting(false)}
          onCreated={() => { setShowMeeting(false); fetchData(); }}
        />
      )}
      {showCall && (
        <CreateCallModal
          dealId={id}
          companyId={deal.company?._id}
          companyName={deal.company?.name}
          onClose={() => setShowCall(false)}
          onCreated={() => { setShowCall(false); setCalls(null); }}
        />
      )}
    </div>
  );
}
