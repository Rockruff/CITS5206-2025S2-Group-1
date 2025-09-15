import Header from "./header";
import MainWithSidebar, { SidebarProvider } from "./sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <Header className="sticky top-0 z-[var(--z-header)] h-[var(--h-header)]" />
      <MainWithSidebar>{children}</MainWithSidebar>
    </SidebarProvider>
  );
}
