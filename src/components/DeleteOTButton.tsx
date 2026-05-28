'use client'

import { eliminarOT } from '@/app/ots/actions'

export function DeleteOTButton({ otId, numero }: { otId: number; numero: string }) {
  async function handleDelete() {
    if (!confirm(`¿Eliminar la OT ${numero}? Esta acción no se puede deshacer.`)) return
    const fd = new FormData()
    fd.append('otId', String(otId))
    await eliminarOT(fd)
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-400 hover:text-red-600 transition-colors"
    >
      Eliminar
    </button>
  )
}
