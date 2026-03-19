"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crisp } from "crisp-sdk-web";
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { I18nProvider } from "@/components/I18nProvider";

const CrispChat = () => {
  const pathname = usePathname();
  const { data } = useSession();

  useEffect(() => {
    if (config?.crisp?.id) {
      Crisp.configure(config.crisp.id);
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (data?.user && config?.crisp?.id) {
      Crisp.session.setData({ userId: data.user?.id });
    }
  }, [data]);

  return null;
};

const ClientLayout = ({ children }) => {
  return (
    <I18nProvider>
      <SessionProvider>
        <NextTopLoader color={config.colors.main} showSpinner={false} />
        {children}
        <Toaster toastOptions={{ duration: 3000 }} />
        <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm shadow-lg" />
        <CrispChat />
      </SessionProvider>
    </I18nProvider>
  );
};

export default ClientLayout;
