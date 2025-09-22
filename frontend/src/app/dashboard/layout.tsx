"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { useAuth } from "../../hooks/auth";
import WithSidebar, { SidebarProvider } from "./sidebar";

// ← import provider

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  // Wrap sidebar tree with its provider to satisfy useSidebar()
  return (
    <SidebarProvider>
      <WithSidebar>{children}</WithSidebar>
    </SidebarProvider>
  );
}
