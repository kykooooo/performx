import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth-server";
import { getDashboardPathForRole } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }
  redirect(getDashboardPathForRole(user.role ?? "player"));
}
