import { Menu } from "lucide-react";

import { SidebarToggle } from "./sidebar";

export default function Header({ className }: { className: string }) {
  return (
    <header className={className}>
      <div className="bg-primary text-on-primary flex h-full items-center gap-4 border-b border-current/10 px-4">
        <div className="flex h-16 items-center justify-center gap-2.5">
          <img className="h-8" src="/logo-uwa.svg" />
          <div className="h-[1em] border-l border-current/25"></div>
          <div className="font-[Novo_Pro] text-xs">
            <div>Health, Safety</div>
            <div>and Wellbeing</div>
          </div>
        </div>
        <SidebarToggle className="ml-auto rounded-full p-2 hover:bg-current/10">
          <Menu className="size-6" />
        </SidebarToggle>
      </div>
    </header>
  );
}
