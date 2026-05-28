"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="w-56 flex-shrink-0 bg-[#1F497D] text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-5 border-b border-white/20">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
          HND Automotriz
        </p>
        <p className="text-lg font-bold leading-tight mt-0.5">Producción</p>
        <p className="text-xs text-blue-300 mt-0.5">Taller Cumbres</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
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
  );
}
