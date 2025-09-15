import { type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AnchorAttributes = React.AnchorHTMLAttributes<HTMLAnchorElement>;
type ButtonAttributes = React.ButtonHTMLAttributes<HTMLButtonElement>;
type BaseProps = AnchorAttributes & ButtonAttributes;

// Display an <a> or a <button> based on whether href is defined or not
function Button(className: string, Icon: LucideIcon | undefined, { href, children, ...props }: BaseProps) {
  if (href) {
    return (
      <Link href={href} className={className} {...props}>
        {Icon && <Icon className="size-[1em]" />}
        {children}
      </Link>
    );
  }
  return (
    <button className={className} {...props}>
      {Icon && <Icon className="size-[1em]" />}
      {children}
    </button>
  );
}

const base =
  "flex cursor-pointer items-center gap-3 rounded px-3 py-2 text-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
const contained = "relative before:absolute before:inset-0 hoctive:before:bg-current/10";
const outlined = "border border-current hoctive:bg-current/10";
const text = "hoctive:bg-current/10";

// A text-style button
export function ButtonText({ className, icon, ...props }: BaseProps & { icon?: LucideIcon }) {
  className = cn(base, text, className);
  return Button(className, icon, props);
}

// An outlined-style button
// Expect user to specify text color
export function ButtonOutlined({ className, icon, ...props }: BaseProps & { className: string; icon?: LucideIcon }) {
  className = cn(base, outlined, className);
  return Button(className, icon, props);
}

// A contained-style button
// Expect user to specify bg and text color
export function ButtonContained({ className, icon, ...props }: BaseProps & { className: string; icon?: LucideIcon }) {
  className = cn(base, contained, className);
  return Button(className, icon, props);
}

// A button with only an icon
// Expect user to specify font-size for icon size
export function ButtonIconOnly({ className, icon: Icon, ...props }: ButtonAttributes & { icon: LucideIcon }) {
  return (
    <button
      className={cn("hoctive:bg-current/10 flex size-[1.5em] items-center justify-center rounded-full", className)}
      {...props}
    >
      <Icon className="size-[1em]" />
    </button>
  );
}
