"use client";

import { useState, useEffect, use } from "react";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  UserIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import CreateTaskModal from "@/components/crm/CreateTaskModal";
import CreateCallModal from "@/components/crm/CreateCallModal";
import CreateMeetingModal from "@/components/crm/CreateMeetingModal";
import EditMeetingModal from "@/components/crm/EditMeetingModal";

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

const CALL_OUTCOME_COLORS = {
  connected: "bg-green-100 text-green-700",
  "left-voicemail": "bg-blue-100 text-blue-700",
  "no-answer": "bg-gray-100 text-gray-600",
  busy: "bg-yellow-100 text-yellow-700",
  "wrong-number": "bg-red-100 text-red-700",
};

const OUTREACH_STATUS_STYLES = {
  contacted:      { cls: "bg-blue-50 text-blue-700 border border-blue-100",    icon: "📧" },
  interested:     { cls: "bg-green-50 text-green-700 border border-green-100", icon: "✅" },
  not_interested: { cls: "bg-gray-100 text-gray-500 border border-gray-200",   icon: "✗"  },
  bounced:        { cls: "bg-red-50 text-red-600 border border-red-100",       icon: "⚠️" },
  replied:        { cls: "bg-teal-50 text-teal-700 border border-teal-100",    icon: "💬" },
  unsubscribed:   { cls: "bg-yellow-50 text-yellow-700 border border-yellow-100", icon: "🚫" },
};

const STAGE_COLORS = {
  "appointment-scheduled": "bg-blue-100 text-blue-700",
  "qualified-to-buy": "bg-indigo-100 text-indigo-700",
  "presentation-scheduled": "bg-purple-100 text-purple-700",
  "decision-maker-bought-in": "bg-orange-100 text-orange-700",
  "contract-sent": "bg-yellow-100 text-yellow-700",
  "closed-won": "bg-green-100 text-green-700",
  "closed-lost": "bg-red-100 text-red-700",
};

export default function ContactDetailClient({ params }) {
  const { id } = use(params);
  const { t } = useI18n();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("emails");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Google / Gmail / Calendar
  const [gmailMessages, setGmailMessages] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  // CRM data
  const [calls, setCalls] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [deals, setDeals] = useState(null);
  const [meetings, setMeetings] = useState(null);
  const [outreachActivities, setOutreachActivities] = useState(null);

  // Modals
  const [showTask, setShowTask] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  const fetchContact = () => {
    fetch(`/api/crm/contacts/${id}`)
      .then(r => r.json())
      .then(d => setContact(d.contact))
      .catch(() => toast.error("Failed to load contact"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContact(); }, [id]);

  useEffect(() => {
    fetch("/api/integrations/google/status")
      .then(r => r.json())
      .then(d => setGoogleConnected(d.connected))
      .catch(() => {});
  }, []);

  // Fetch outreach activities (Instantly imports) for this contact
  useEffect(() => {
    if (!id) return;
    fetch(`/api/crm/activities?contact=${id}`)
      .then(r => r.json())
      .then(d => {
        const outreach = (d.activities || []).filter(
          a => a.type === "email" && a.metadata?.source === "instantly"
        );
        setOutreachActivities(outreach);
      })
      .catch(() => setOutreachActivities([]));
  }, [id]);

  // Fetch Gmail when contact + google status ready
  useEffect(() => {
    if (gmailMessages !== null || !contact?.email || !googleConnected) return;
    fetch(`/api/integrations/gmail?emails=${encodeURIComponent(contact.email)}`)
      .then(r => r.json())
      .then(d => setGmailMessages(d.messages || []))
      .catch(() => setGmailMessages([]));
  }, [contact, gmailMessages, googleConnected]);

  // Fetch CRM meetings for this contact
  useEffect(() => {
    if (activeTab !== "meetings" || meetings !== null) return;
    fetch(`/api/crm/meetings?contact=${id}&limit=50`)
      .then(r => r.json())
      .then(d => setMeetings(d.meetings || []))
      .catch(() => setMeetings([]));
  }, [activeTab, meetings, id]);

  // Fetch Google Calendar events, sync to DB as CRM meetings, then reload
  useEffect(() => {
    if (activeTab !== "meetings" || calendarEvents !== null || !contact?.email || !googleConnected) return;
    fetch(`/api/integrations/calendar?q=${encodeURIComponent(contact.email)}`)
      .then(r => r.json())
      .then(async d => {
        const events = d.events || [];
        setCalendarEvents([]);
        if (events.length > 0) {
          const companyId = contact.company?._id || contact.company || null;
          await fetch("/api/crm/meetings/sync-calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company: companyId, contactId: id, events }),
          });
          setMeetings(null); // trigger reload
        }
      })
      .catch(() => setCalendarEvents([]));
  }, [activeTab, contact, calendarEvents, googleConnected]);

  // Fetch calls on calls tab
  useEffect(() => {
    if (activeTab !== "calls" || calls !== null) return;
    fetch(`/api/crm/calls?contact=${id}`)
      .then(r => r.json())
      .then(d => setCalls(d.calls || []))
      .catch(() => setCalls([]));
  }, [activeTab, calls, id]);

  // Fetch tasks on tasks tab
  useEffect(() => {
    if (activeTab !== "tasks" || tasks !== null) return;
    fetch(`/api/crm/tasks?contact=${id}`)
      .then(r => r.json())
      .then(d => setTasks(d.tasks || []))
      .catch(() => setTasks([]));
  }, [activeTab, tasks, id]);

  // Fetch deals on deals tab
  useEffect(() => {
    if (activeTab !== "deals" || deals !== null) return;
    fetch(`/api/crm/deals?contact=${id}`)
      .then(r => r.json())
      .then(d => setDeals(d.deals || []))
      .catch(() => setDeals([]));
  }, [activeTab, deals, id]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await fetch("/api/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", content: noteText, contact: id }),
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
      setTasks(null); // refetch
    } catch {
      toast.error("Failed to update task");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!contact) return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-gray-500">Contact not found</p>
      <Link href="/dashboard/crm/contacts" className="mt-4 text-indigo-600 hover:underline text-sm">{t("common.back")}</Link>
    </div>
  );

  const tabs = [
    { key: "emails", label: t("crm.company.tabs.emails") },
    { key: "notes", label: t("crm.company.tabs.notes") },
    { key: "calls", label: t("crm.company.tabs.calls") },
    { key: "tasks", label: t("crm.company.tabs.tasks") },
    { key: "meetings", label: t("crm.company.tabs.meetings") },
    { key: "deals", label: t("crm.sidebar.deals") },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <Link
            href={contact.company ? `/dashboard/crm/companies/${contact.company._id}` : "/dashboard/crm/contacts"}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {contact.company ? contact.company.name : t("crm.sidebar.contacts")}
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-red-700">{contact.firstName?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{contact.firstName} {contact.lastName}</h2>
              {contact.jobTitle && <p className="text-xs text-gray-500">{contact.jobTitle}</p>}
              {contact.company && (
                <Link href={`/dashboard/crm/companies/${contact.company._id}`} className="text-xs text-indigo-600 hover:underline">
                  {contact.company.name}
                </Link>
              )}
            </div>
          </div>
          {/* Outreach status badge */}
          {contact.outreachStatus && OUTREACH_STATUS_STYLES[contact.outreachStatus] && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${OUTREACH_STATUS_STYLES[contact.outreachStatus].cls}`}>
                <span>{OUTREACH_STATUS_STYLES[contact.outreachStatus].icon}</span>
                {t(`crm.outreach.${contact.outreachStatus}`)}
              </span>
              {contact.outreachCampaign && (
                <span className="text-xs text-gray-400 truncate max-w-[120px]" title={contact.outreachCampaign}>
                  {contact.outreachCampaign}
                </span>
              )}
            </div>
          )}
        </div>

        {/* About */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">{t("crm.company.about")}</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: t("common.email"), value: contact.email },
              { label: t("common.phone"), value: contact.phone },
              { label: t("crm.contacts.fields.mobilePhone"), value: contact.mobilePhone },
              { label: t("crm.contacts.fields.lifecycleStage"), value: contact.lifecycleStage ? t(`crm.lifecycleStage.${contact.lifecycleStage}`) : null },
              { label: t("crm.contacts.fields.linkedinUrl"), value: contact.linkedinUrl },
              { label: t("crm.outreach.campaign"), value: contact.outreachCampaign },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
                <span className="text-gray-800 text-xs text-right truncate">
                  {value || <span className="text-gray-300">—</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Action buttons */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
          {[
            { key: "note", icon: ChatBubbleLeftIcon, action: () => setActiveTab("notes") },
            { key: "email", icon: EnvelopeIcon, action: () => setActiveTab("emails") },
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

          {/* Gmail emails */}
          {activeTab === "emails" && (
            <div className="space-y-2">
              {/* Outreach activities from Instantly imports */}
              {outreachActivities?.length > 0 && outreachActivities.map(a => {
                const status = a.metadata?.outreachStatus;
                const campaign = a.metadata?.campaignName;
                const statusStyle = OUTREACH_STATUS_STYLES[status] || { cls: "bg-gray-100 text-gray-500", icon: "📧" };
                return (
                  <div key={a._id} className="bg-white rounded-lg border border-indigo-100 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">✉️</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Instantly</span>
                            {campaign && <span className="text-xs text-gray-600 font-medium truncate max-w-[180px]">{campaign}</span>}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle.cls}`}>
                          <span>{statusStyle.icon}</span>
                          {t(`crm.outreach.${status}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!googleConnected ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">{t("crm.integrations.google.connectPrompt")}</p>
                  <a href="/dashboard/crm/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium">
                    {t("crm.integrations.google.connect")}
                  </a>
                </div>
              ) : !contact.email ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.integrations.google.noEmails")}</div>
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

          {/* Notes */}
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

          {/* Calls */}
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
                ))
              )}
            </div>
          )}

          {/* Tasks */}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setShowTask(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <PlusIcon className="h-4 w-4" />
                  {t("crm.tasks.newTask")}
                </button>
              </div>
              {tasks === null ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : tasks.length === 0 ? (
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
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Meetings tab — CRM meetings (including synced Google Calendar ones) */}
          {activeTab === "meetings" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setShowMeeting(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <PlusIcon className="h-4 w-4" />
                  {t("crm.meetings.newMeeting")}
                </button>
              </div>

              {meetings === null ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              ) : (
                meetings.map(m => (
                  <div key={m._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{m.source === "google" ? "🗓️" : "📅"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-gray-800">
                                {m.title || t(`crm.meetings.subtype.${m.subtype || "other"}`)}
                              </p>
                              {m.source === "google" && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Google</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MEETING_SUBTYPE_COLORS[m.subtype] || "bg-gray-100 text-gray-600"}`}>
                                {t(`crm.meetings.subtype.${m.subtype || "other"}`)}
                              </span>
                              {m.outcome && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MEETING_OUTCOME_COLORS[m.outcome] || "bg-gray-100 text-gray-600"}`}>
                                  {t(`crm.meetings.outcome.${m.outcome}`)}
                                </span>
                              )}
                              {m.duration > 0 && <span className="text-xs text-gray-400">{m.duration} min</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{new Date(m.meetingDate).toLocaleString()}</span>
                            <button onClick={() => setEditingMeeting(m)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {m.deals?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.deals.map(d => (
                              <Link key={d._id} href={`/dashboard/crm/deals/${d._id}`}
                                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                {d.title}
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

          {/* Deals */}
          {activeTab === "deals" && (
            <div className="space-y-3">
              {deals === null ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : deals.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">{t("crm.activities.noActivities")}</div>
              ) : (
                deals.map(deal => (
                  <Link key={deal._id} href={`/dashboard/crm/deals/${deal._id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-700">€</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{deal.title}</p>
                          {deal.amount != null && (
                            <p className="text-xs text-gray-500">€{deal.amount.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STAGE_COLORS[deal.stage] || "bg-gray-100 text-gray-600"}`}>
                        {t(`crm.deals.stages.${deal.stage}`)}
                      </span>
                    </div>
                    {deal.closeDate && (
                      <p className="text-xs text-gray-400 mt-2">{t("crm.deals.fields.closeDate")}: {new Date(deal.closeDate).toLocaleDateString()}</p>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {showTask && (
        <CreateTaskModal
          contactId={id}
          onClose={() => setShowTask(false)}
          onCreated={() => { setShowTask(false); setTasks(null); }}
        />
      )}
      {showCall && (
        <CreateCallModal
          contactId={id}
          onClose={() => setShowCall(false)}
          onCreated={() => { setShowCall(false); setCalls(null); }}
        />
      )}
      {showMeeting && (
        <CreateMeetingModal
          contactId={id}
          onClose={() => setShowMeeting(false)}
          onCreated={() => { setShowMeeting(false); setMeetings(null); }}
        />
      )}
      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
          onUpdated={() => { setEditingMeeting(null); setMeetings(null); toast.success(t("crm.meetings.edit.success")); }}
        />
      )}
    </div>
  );
}
