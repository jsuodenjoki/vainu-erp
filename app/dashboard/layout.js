import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";

export default async function LayoutPrivate({ children }) {
  const session = await auth();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  return <>{children}</>;
}
