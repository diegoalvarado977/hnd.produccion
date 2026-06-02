"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const links = [
  { href: "/ots",        label: "Órdenes de Trabajo", icon: "🔧" },
  { href: "/asistencia", label: "Asistencia",          icon: "📅" },
  { href: "/avance",     label: "Avance Semanal",      icon: "📋" },
  { href: "/reporte",    label: "Reporte Semanal",     icon: "📊" },
  { href: "/dashboard",  label: "Dashboard Técnicos",  icon: "👥" },
  { href: "/config",     label: "Configuración",       icon: "⚙️" },
];

function NavLinks({ path }: { path: string }) {
  return (
    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      {links.map(({ href, label, icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-white/20 text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      {/* ── Barra superior mobile ──────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-[#1F497D] text-white flex items-center justify-between px-4 shadow-md">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300 leading-none">HND Automotriz</p>
          <p className="text-base font-bold leading-tight">Producción</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 -mr-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Menú"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Drawer mobile (overlay) ────────────────────────────────────── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#1F497D] text-white flex flex-col shadow-xl md:hidden">
            <div className="px-4 pt-5 pb-3 border-b border-white/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">HND Automotriz</p>
                <p className="text-lg font-bold leading-tight mt-0.5">Producción</p>
                <p className="text-xs text-blue-300 mt-0.5">Taller Cumbres</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-blue-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks path={path} />
            <div className="px-4 py-3 border-t border-white/20">
              <p className="text-xs text-blue-300">v1.0 — MVP</p>
            </div>
          </aside>
        </>
      )}

      {/* ── Sidebar desktop (siempre visible en md+) ───────────────────── */}
      <aside className="hidden md:flex md:flex-col w-56 flex-shrink-0 bg-[#1F497D] text-white">
        <div className="px-4 py-5 border-b border-white/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">HND Automotriz</p>
          <p className="text-lg font-bold leading-tight mt-0.5">Producción</p>
          <p className="text-xs text-blue-300 mt-0.5">Taller Cumbres</p>
        </div>
        <NavLinks path={path} />
        <div className="px-4 py-3 border-t border-white/20">
          <p className="text-xs text-blue-300">v1.0 — MVP</p>
        </div>
      </aside>
    </>
  );
}
