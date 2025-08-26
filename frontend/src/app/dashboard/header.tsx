import { SidebarToggle } from "./sidebar";

export default function Header({ className }: { className: string }) {
  return (
    <header className={className}>
      <div className="bg-primary text-on-primary flex h-full items-center gap-4 px-4">
        <a className="flex h-16 items-center justify-center gap-2.5" href="/">
          <img className="h-8" src="/logo-uwa.svg" />
          <div className="h-[1em] border-l border-current/25"></div>
          <div className="font-[Novo_Pro] text-xs">
            <div>Health, Safety</div>
            <div>and Wellbeing</div>
          </div>
        </a>
        <SidebarToggle className="ml-auto text-2xl" />
      </div>
    </header>
  );
}
