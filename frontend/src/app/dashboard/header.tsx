import { SidebarToggle } from "./sidebar";
import Logo from "@/components/app/logo";

export default function Header({ className }: { className: string }) {
  return (
    <header className={className}>
      <div className="bg-primary text-on-primary flex h-full items-center gap-4 px-4">
        <Logo />
        <SidebarToggle className="ml-auto text-2xl" />
      </div>
    </header>
  );
}
