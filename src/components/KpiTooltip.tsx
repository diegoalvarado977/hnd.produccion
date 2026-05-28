'use client'

export function KpiTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group inline-flex items-center gap-1.5 cursor-default">
      <span>{label}</span>
      <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#4472C4] group-hover:text-white transition-colors">
        ?
      </span>
      {/* Tooltip */}
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150
                      absolute left-0 bottom-full mb-2 z-50 w-72 p-3
                      bg-gray-900 text-white text-xs rounded-xl shadow-2xl
                      pointer-events-none">
        {children}
        {/* Arrow */}
        <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
      </div>
    </div>
  )
}
