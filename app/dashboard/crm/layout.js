import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";
import CRMSidebar from "@/components/crm/CRMSidebar";

export default async function CRMLayout({ children }) {
  const session = await auth();
  if (!session) redirect(config.auth.loginUrl);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <CRMSidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
