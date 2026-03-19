"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  PhoneIcon,
  CalendarDaysIcon,
  BoltIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const navItems = [
  {
    key: "companies",
    href: "/dashboard/crm/companies",
    icon: BuildingOffice2Icon,
  },
  { key: "contacts", href: "/dashboard/crm/contacts", icon: UserGroupIcon },
  { key: "deals", href: "/dashboard/crm/deals", icon: CurrencyEuroIcon },
  { key: "tasks", href: "/dashboard/crm/tasks", icon: CheckCircleIcon },
  { key: "calls", href: "/dashboard/crm/calls", icon: PhoneIcon },
  { key: "meetings", href: "/dashboard/crm/meetings", icon: CalendarDaysIcon },
  { key: "activities", href: "/dashboard/crm/activities", icon: BoltIcon },
];

export default function CRMSidebar({ user }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-gray-900 text-white transition-all duration-200 flex-shrink-0 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-700">
        {!collapsed && (
          <Link href="/dashboard/crm" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Vaiku"
              className="h-7 w-auto object-contain"
            />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard/crm" className="mx-auto">
            <img
              src="/logo.png"
              alt="Vaiku"
              className="h-7 w-auto object-contain"
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ${
            collapsed ? "mx-auto mt-0" : ""
          }`}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronDoubleLeftIcon
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(({ key, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors group ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              title={collapsed ? t(`crm.sidebar.${key}`) : ""}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate">{t(`crm.sidebar.${key}`)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-gray-700 space-y-1">
        <Link
          href="/dashboard/crm/settings"
          className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          title={collapsed ? t("crm.sidebar.settings") : ""}
        >
          <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className="truncate">{t("crm.sidebar.settings")}</span>
          )}
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
            {user?.name?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.name || user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
