export default function ({ variant = "light" }: { variant?: "dark" | "light" }) {
  const src = variant === "dark" ? "/uwa-logo-dark.svg" : "/uwa-logo-light.svg";
  const color = variant === "dark" ? "text-primary" : "text-on-primary";

  return (
    <a href="/" className="flex h-16 items-center justify-center gap-2.5">
      <img className="h-8" src={src} />
      <div className="h-[1em] border-l border-current/25"></div>
      <div className="font-[Novo_Pro] text-xs">
        <div className={color}>Health, Safety</div>
        <div className={color}>and Wellbeing</div>
      </div>
    </a>
  );
}
