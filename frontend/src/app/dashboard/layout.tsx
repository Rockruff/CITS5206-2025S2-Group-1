import Header from "./header";
import Sidebar, { SidebarProvider } from "./sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <Header className="h-header-height sticky top-0 z-10" />
      <div className="md:h-sidebar-height max-md:contents md:flex">
        <Sidebar
          className="cotain-strict h-sidebar-height max-md:fixed max-md:z-10"
          type="transition-[width]"
          before="hidden"
          start="w-0"
          end="w-sidebar-width"
        />
        <main className="flex flex-col gap-4 p-4 md:flex-1 md:gap-8 md:overflow-y-auto md:p-8">{children}</main>
      </div>
    </SidebarProvider>
  );
}
