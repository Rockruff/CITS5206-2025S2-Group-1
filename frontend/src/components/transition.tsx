import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface TransitionConfig {
  show?: boolean; // true to show, false to hide
  children?: React.ReactNode; // content inside the transition
  className?: string; // base class applied always
  type: string; // CSS transition type (e.g., 'transition-opacity')
  before?: string; // class before animation (hidden state)
  start: string; // class at start of transition
  end: string; // class at end of transition
  after?: string; // class after animation (visible state)
}

export default function Transition({ show, children, className, type, before, start, end, after }: TransitionConfig) {
  // Inverse of show, for logic clarity
  const hide = !show;

  const BEFORE = clsx(className, before || start); // before animation (hidden)
  const START = clsx(className, type, start); // start of transition
  const END = clsx(className, type, end); // end of transition
  const AFTER = clsx(className, after || end); // after animation (visible)

  // Initial class; doesn’t update on rerender, so useEffect handles DOM changes
  const [initial] = useState(hide ? BEFORE : AFTER);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = hide ? BEFORE : AFTER;
    const from = show ? START : END;
    const to = show ? END : START;
    if (el.className === target) return;

    el.className = from;
    el.offsetHeight; // force reflow for transition to register
    el.className = to;
    el.ontransitionend = () => (el.className = target);
  }, [show]);

  return (
    <div ref={ref} className={initial}>
      {children}
    </div>
  );
}
