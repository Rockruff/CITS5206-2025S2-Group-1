import Header from "./header";
import MainWithSidebar, { SidebarProvider } from "./sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <Header className="sticky top-0 z-(--z-header) h-(--h-header)" />
      <MainWithSidebar>{children}</MainWithSidebar>
    </SidebarProvider>
  );
}
