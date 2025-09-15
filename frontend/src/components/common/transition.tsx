import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface TransitionConfig extends React.HTMLAttributes<HTMLDivElement> {
  show?: boolean;
  type: string;
  before?: string;
  start: string;
  end: string;
  after?: string;
}

export default function Transition({
  show, // true to show, false to hide
  children, // content inside the transition
  className, // base class applied always
  type, // CSS transition type (e.g., 'transition-opacity')
  before, // class before animation (hidden state)
  start, // class at start of transition
  end, // class at end of transition
  after, // class after animation (visible state)
  ...props
}: TransitionConfig) {
  // Inverse of show, for logic clarity
  const hide = !show;

  const BEFORE = cn(className, before || start); // before animation (hidden)
  const START = cn(className, type, start); // start of transition
  const END = cn(className, type, end); // end of transition
  const AFTER = cn(className, after || end); // after animation (visible)

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
    <div ref={ref} className={initial} {...props}>
      {children}
    </div>
  );
}
