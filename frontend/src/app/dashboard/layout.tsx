"use client";

import { LoaderCircleIcon } from "lucide-react";

import Header from "./header";
import MainWithSidebar, { SidebarProvider } from "./sidebar";
import { logout } from "@/api/common";
import { getCurrentUser } from "@/api/users";
import Logo from "@/components/app/logo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, error } = getCurrentUser();

  if (!user) {
    if (error) logout();

    return (
      <div className="bg-primary text-primary-foreground flex h-screen w-screen flex-col items-center justify-center gap-4">
        <LoaderCircleIcon className="size-8 animate-spin" />
        <span>Loading</span>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="bg-primary text-primary-foreground flex h-screen w-screen flex-col items-center justify-center gap-4">
        <Logo />
        <span>You don't have the permission required to visit this page.</span>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Header className="sticky top-0 z-[var(--z-header)] h-[var(--h-header)]" />
      <MainWithSidebar>{children}</MainWithSidebar>
    </SidebarProvider>
  );
}
