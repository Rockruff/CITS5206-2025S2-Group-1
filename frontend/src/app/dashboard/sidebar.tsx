"use client";

import { BookOpenText, ChartSpline, CircleGauge, FolderDown, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useState } from "react";

import Transition from "@/components/transition";
import useResponsive from "@/hooks/responsive";

function SidebarContent() {
  return (
    <div className="bg-primary text-on-primary w-sidebar-width h-sidebar-height flex flex-col">
      <div className="flex-1 overflow-scroll border-y border-current/10">
        <nav className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xs/6 uppercase opacity-80">Main</h2>
            <Link href="/dashboard" className="flex items-center gap-3 rounded px-3 py-2 hover:bg-current/10">
              <CircleGauge className="size-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/users" className="flex items-center gap-3 rounded px-3 py-2 hover:bg-current/10">
              <Users className="size-4" />
              <span>Users</span>
            </Link>
            <Link href="/dashboard/trainings" className="flex items-center gap-3 rounded px-3 py-2 hover:bg-current/10">
              <BookOpenText className="size-4" />
              <span>Training Programs</span>
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xs/6 uppercase opacity-80">Reports</h2>
            <Link href="/dashboard/analytics" className="flex items-center gap-3 rounded px-3 py-2 hover:bg-current/10">
              <ChartSpline className="size-4" />
              <span>Analytics</span>
            </Link>
            <Link
              href="/dashboard/export-data"
              className="flex items-center gap-3 rounded px-3 py-2 hover:bg-current/10"
            >
              <FolderDown className="size-4" />
              <span>Export Data</span>
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xs/6 uppercase opacity-80">Account</h2>
            <Link href="/logout" className="flex items-center gap-3 rounded px-3 py-2 hover:bg-current/10">
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </Link>
          </div>
        </nav>
      </div>

      <div className="flex h-20 items-center gap-4 px-4">
        <img
          className="size-12 flex-none rounded-full object-cover"
          src="https://student.sims.uwa.edu.au/connect/webconnect?pagecd=UCPEIMAGE"
        />
        <div>
          <div className="line-clamp-2 text-xs/4 font-semibold break-all">Your Name</div>
          <div className="mt-1 truncate text-[.6em]/none before:content-['('] after:content-[')']">00000000</div>
        </div>
      </div>
    </div>
  );
}

interface SidebarContextType {
  isMobileSidebarOpen: boolean;
  isDesktopSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (context) return context;
  throw new Error("useSidebar must be used within a SidebarProvider");
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(true);
  const isDesktopMode = useResponsive("md");

  const toggleSidebar = () => {
    const setIsOpen = isDesktopMode ? setIsDesktopSidebarOpen : setIsMobileSidebarOpen;
    setIsOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isMobileSidebarOpen,
        isDesktopSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarToggle({ className, children }: { className: string; children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button className={className} onClick={toggleSidebar}>
      {children}
    </button>
  );
}

export default function Sidebar({
  className,
  type,
  before,
  start,
  end,
}: {
  className: string;
  type: string;
  before: string;
  start: string;
  end: string;
}) {
  const isDesktopMode = useResponsive("md");
  const { isMobileSidebarOpen, isDesktopSidebarOpen } = useSidebar();

  if (
    isDesktopMode === undefined || // media query result unknown yet (SSR)
    isDesktopMode // is indeed desktop mode
  ) {
    return (
      <div className="max-md:hidden md:contents">
        <Transition
          key="desktop-sidebar"
          show={isDesktopSidebarOpen}
          className={className}
          type={type}
          before={before}
          start={start}
          end={end}
        >
          <SidebarContent />
        </Transition>
      </div>
    );
  }

  return (
    <div className="max-md:contents md:hidden">
      <Transition
        key="mobile-sidebar-overlay"
        show={isMobileSidebarOpen}
        className="fixed inset-0 z-5 bg-black/50"
        type="transition-[opacity,backdrop-filter]"
        before="hidden"
        start="opacity-0"
        end="backdrop-blur-sm"
      />
      <Transition
        key="mobile-sidebar"
        show={isMobileSidebarOpen}
        className={className}
        type={type}
        before={before}
        start={start}
        end={end}
      >
        <SidebarContent />
      </Transition>
    </div>
  );
}
