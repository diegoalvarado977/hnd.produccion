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

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false) }, [path]);

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#1F497D] text-white flex items-center justify-between px-4 shadow-lg">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300 leading-none">HND Automotriz</p>
          <p className="text-base font-bold leading-tight">Producción</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
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

      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={[
          "fixed md:static inset-y-0 left-0 z-40",
          "w-56 flex-shrink-0 bg-[#1F497D] text-white flex flex-col",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-white/20 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
            HND Automotriz
          </p>
          <p className="text-lg font-bold leading-tight mt-0.5">Producción</p>
          <p className="text-xs text-blue-300 mt-0.5">Taller Cumbres</p>
        </div>

        {/* Mobile sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-white/20 md:hidden">
          <p className="text-xs text-blue-300">Taller Cumbres</p>
          <p className="text-sm font-semibold mt-0.5">Menú de navegación</p>
        </div>

        {/* Navigation */}
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/20">
          <p className="text-xs text-blue-300">v1.0 — MVP</p>
        </div>
      </aside>
    </>
  );
}
