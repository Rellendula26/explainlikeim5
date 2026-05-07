"use client";

import { useEffect, useRef } from "react";

type CursorMode = "default" | "card" | "button" | "input";

function isDesktopPointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function modeFromElement(el: Element | null): CursorMode {
  if (!el) return "default";
  const target = el.closest<HTMLElement>("[data-cursor]");
  const mode = target?.dataset.cursor;
  if (mode === "button" || mode === "card" || mode === "input") return mode;
  if (el.closest("button,a,[role='button']")) return "button";
  if (el.closest("input,textarea,select")) return "input";
  return "default";
}

export function CursorOrb() {
  const orbRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const enabledRef = useRef(false);
  const modeRef = useRef<CursorMode>("default");
  const pressedRef = useRef(false);

  useEffect(() => {
    enabledRef.current = isDesktopPointer();
    if (!enabledRef.current) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let rafId = 0;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      modeRef.current = modeFromElement(event.target as Element | null);
    };

    const onOver = (event: PointerEvent) => {
      modeRef.current = modeFromElement(event.target as Element | null);
    };

    const onDown = () => {
      pressedRef.current = true;
    };
    const onUp = () => {
      pressedRef.current = false;
    };

    const onFocusIn = (event: FocusEvent) => {
      modeRef.current = modeFromElement(event.target as Element | null);
    };
    const onFocusOut = () => {
      modeRef.current = "default";
    };

    const tick = () => {
      // premium lag: slower easing for orb, faster for dot
      current.x += (target.x - current.x) * 0.13;
      current.y += (target.y - current.y) * 0.13;

      const orb = orbRef.current;
      const dot = dotRef.current;
      if (orb && dot) {
        const mode = modeRef.current;
        const scale =
          mode === "button" ? 1.35 : mode === "input" ? 1.18 : mode === "card" ? 1.12 : 1.0;
        const pressed = pressedRef.current ? 0.92 : 1.0;
        const opacity = mode === "default" ? 0.7 : 0.92;

        orb.style.opacity = String(opacity);
        orb.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0) scale(${
          scale * pressed
        })`;

        // dot tracks slightly faster
        dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate3d(-50%, -50%, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    tick();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabledRef.current) return null;

  return (
    <>
      <div
        ref={orbRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400/30 via-violet-500/30 to-fuchsia-500/30 blur-2xl will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[101] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_20px_rgba(34,211,238,0.45)] will-change-transform"
      />
    </>
  );
}

