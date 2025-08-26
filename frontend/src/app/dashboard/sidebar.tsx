"use client";

import { BookOpenText, ChartSpline, CircleGauge, FolderDown, LogOut, Menu, Users } from "lucide-react";
import { createContext, useContext, useState } from "react";

import { ButtonContained, ButtonIconOnly, ButtonOutlined, ButtonText } from "@/components/common/button";
import Dialog, { useModal } from "@/components/common/dialog";
import Transition from "@/components/common/transition";
import { useResponsive } from "@/hooks/responsive";
import { useScrollLock } from "@/hooks/scroll-lock";

function SidebarContent() {
  const logoutModal = useModal();
  const { isMobileMode, setIsMobileSidebarOpen } = useSidebar();
  const closeMobileSidebar = () => isMobileMode && setIsMobileSidebarOpen(false);

  return (
    <div className="bg-primary text-on-primary flex h-(--h-sidebar) w-(--w-sidebar) flex-col">
      <div className="flex-1 overflow-scroll border-y border-current/10">
        <nav className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xs/6 uppercase opacity-80">Main</h2>
            <ButtonText href="/dashboard" icon={CircleGauge} onClick={closeMobileSidebar}>
              Dashboard
            </ButtonText>
            <ButtonText href="/dashboard/users" icon={Users} onClick={closeMobileSidebar}>
              Users
            </ButtonText>
            <ButtonText href="/dashboard/trainings" icon={BookOpenText} onClick={closeMobileSidebar}>
              Training Programs
            </ButtonText>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xs/6 uppercase opacity-80">Reports</h2>
            <ButtonText href="/dashboard/analytics" icon={ChartSpline} onClick={closeMobileSidebar}>
              Analytics
            </ButtonText>
            <ButtonText href="/dashboard/export-data" icon={FolderDown} onClick={closeMobileSidebar}>
              Export Data
            </ButtonText>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xs/6 uppercase opacity-80">Account</h2>
            <ButtonText onClick={logoutModal.open} icon={LogOut}>
              Sign Out
            </ButtonText>

            <Dialog
              ref={logoutModal.ref}
              title="Info"
              actions={
                <>
                  <ButtonContained href="/logout" className="bg-primary text-on-primary ml-auto">
                    Yes
                  </ButtonContained>
                  <ButtonOutlined className="text-primary" onClick={logoutModal.close}>
                    No
                  </ButtonOutlined>
                </>
              }
            >
              Are you sure you want to log out?
            </Dialog>
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

type SidebarContextType = {
  isMobileMode: boolean | undefined;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDesktopSidebarOpen: boolean;
  setIsDesktopSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (context) return context;
  throw new Error("useSidebar must be used within a SidebarProvider");
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobileMode = useResponsive("max-md");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(true);

  return (
    <SidebarContext.Provider
      value={{
        isMobileMode,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isDesktopSidebarOpen,
        setIsDesktopSidebarOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarToggle({ className }: { className: string }) {
  const { isMobileMode, setIsMobileSidebarOpen, setIsDesktopSidebarOpen } = useSidebar();
  const setIsOpen = isMobileMode ? setIsMobileSidebarOpen : setIsDesktopSidebarOpen;
  return <ButtonIconOnly icon={Menu} className={className} onClick={() => setIsOpen((prev) => !prev)} />;
}

function Sidebar() {
  const { isMobileMode, isMobileSidebarOpen, setIsMobileSidebarOpen, isDesktopSidebarOpen } = useSidebar();

  // Prevent body scroll if mobile sidebar is shown
  useScrollLock(!!isMobileMode && isMobileSidebarOpen);

  // media query result unknown yet due to SSR (isMobileMode === undefined)
  // or is indeed not mobile mode (isMobileMode === false)
  if (!isMobileMode) {
    return (
      <aside className="max-md:hidden md:contents">
        <Transition
          key="desktop-sidebar"
          show={isDesktopSidebarOpen}
          className="cotain-strict h-(--h-sidebar)"
          type="transition-[width]"
          before="hidden"
          start="w-0"
          end="w-(--w-sidebar)"
        >
          <SidebarContent />
        </Transition>
      </aside>
    );
  }

  return (
    <aside className="max-md:contents md:hidden">
      <Transition
        key="mobile-sidebar-overlay"
        show={isMobileSidebarOpen}
        className="fixed z-(--z-sidebar) h-(--h-sidebar) w-screen bg-black"
        type="transition-[opacity]"
        before="hidden"
        start="opacity-0"
        end="opacity-50"
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      <Transition
        key="mobile-sidebar"
        show={isMobileSidebarOpen}
        className="fixed z-(--z-sidebar) h-(--h-sidebar) contain-strict"
        type="transition-[width]"
        before="hidden"
        start="w-0"
        end="w-(--w-sidebar)"
      >
        <SidebarContent />
      </Transition>
    </aside>
  );
}

export default function WithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-md:contents md:flex">
      <Sidebar />
      <main className="md:h-(--h-sidebar) md:flex-1 md:overflow-y-auto">
        <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</div>
      </main>
    </div>
  );
}
