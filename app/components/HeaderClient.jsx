"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isActive(pathname, href) {
  if (href.startsWith("/#")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function StickyHeader({ children }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <header data-scrolled={scrolled} className="sticky top-0 z-40 border-b border-transparent bg-bg/90 text-ink backdrop-blur-md transition-colors duration-200 data-[scrolled=true]:border-black/10 supports-[not(backdrop-filter:blur(1px))]:bg-bg">
    {children}
  </header>;
}

export function NavLinks({ items }) {
  const pathname = usePathname();
  return <div className="hidden items-center gap-9 text-xs font-medium text-muted lg:flex">
    {items.map(([label, href]) => {
      const active = isActive(pathname, href);
      return <Link aria-current={active ? "page" : undefined} className={`relative py-2 transition-colors duration-150 hover:text-ink focus-visible:text-ink ${active ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-ink" : ""}`} href={href} key={label}>{label}</Link>;
    })}
  </div>;
}

export function MobileMenu({ items, actionHref, actionLabel }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => [...(panel.current?.querySelectorAll("a[href], button:not([disabled])") || [])];
    focusables()[0]?.focus();
    function onKey(event) {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); return; }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); };
  }, [open]);

  return <div className="lg:hidden">
    <button ref={trigger} type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center text-ink">
      <svg viewBox="0 0 20 14" className="h-3.5 w-5" fill="none" aria-hidden="true"><path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.4" /></svg>
      <span className="sr-only">Open menu</span>
    </button>
    {open ? <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div ref={panel} id="mobile-menu" className="mobile-sheet absolute inset-x-0 bottom-0 bg-bg px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-overlay">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15" aria-hidden="true" />
        <nav aria-label="Mobile navigation">
          {items.map(([label, href]) => {
            const active = isActive(pathname, href);
            return <Link aria-current={active ? "page" : undefined} href={href} key={label} onClick={() => setOpen(false)} className={`flex min-h-14 items-center justify-between border-b border-black/10 text-lg tracking-tight-1 ${active ? "font-semibold" : ""}`}>{label}<span aria-hidden="true" className="text-subtle">→</span></Link>;
          })}
        </nav>
        <Link href={actionHref} onClick={() => setOpen(false)} className="btn btn-primary mt-6 w-full">{actionLabel}</Link>
        <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="mt-2 min-h-12 w-full text-xs uppercase tracking-caps text-muted">Close</button>
      </div>
    </div> : null}
  </div>;
}

export function CurrentYear() {
  return <>{new Date().getFullYear()}</>;
}
