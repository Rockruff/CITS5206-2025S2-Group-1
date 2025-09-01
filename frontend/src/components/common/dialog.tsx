"use client";

import { X } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ButtonIconOnly } from "@/components/common/button";
import Transition from "@/components/common/transition";
import { withClientOnly } from "@/hooks/client-only";
import { useScrollLock } from "@/hooks/scroll-lock";

interface ModalProps {
  children: React.ReactNode;
  title: string;
  actions: React.ReactNode;
}

export interface ModalHandle {
  open: () => void;
  close: () => void;
}

export function useModal() {
  const ref = useRef<ModalHandle>(null);
  const open = () => ref.current?.open();
  const close = () => ref.current?.close();
  return { ref, open, close };
}

const Dialog = withClientOnly(
  forwardRef<ModalHandle, ModalProps>((props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    useScrollLock(isOpen);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    useImperativeHandle(ref, () => ({ open, close }));

    const content = (
      <Transition
        show={isOpen}
        type="transition-opacity"
        before="hidden"
        start="opacity-0"
        end="opacity-100"
        className="fixed inset-0 z-(--z-popup) grid place-items-center bg-black/50"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return; // ignore clicks inside modal
          close(); // close on background click
        }}
      >
        <div className="bg-popover flex max-h-[calc(100vh-8*var(--spacing))] max-w-[calc(100vw-8*var(--spacing))] flex-col gap-4 rounded p-4 md:min-w-sm md:p-6">
          <div className="flex items-center gap-2">
            <span className="mr-auto flex-1 font-bold">{props.title}</span>
            <ButtonIconOnly icon={X} onClick={close} />
          </div>
          <div className="flex-1 overflow-auto">{props.children}</div>
          <div className="flex items-center gap-2 empty:hidden">{props.actions}</div>
        </div>
      </Transition>
    );

    const container = document.body;
    return createPortal(content, container);
  }),
);

export default Dialog;
