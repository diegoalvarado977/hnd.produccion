import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const data: { activo?: boolean; nombre?: string } = {}
  if (typeof body.activo  === 'boolean') data.activo  = body.activo
  if (typeof body.nombre  === 'string')  data.nombre  = body.nombre.trim().toUpperCase()

  const tecnico = await prisma.tecnico.update({
    where: { id: parseInt(id) },
    data,
  })
  return NextResponse.json(tecnico)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseInt(id)

  // Solo permitir eliminar si no tiene OTs asignadas
  const count = await prisma.oTTecnico.count({ where: { tecnicoId: numId } })
  if (count > 0) {
    return NextResponse.json(
      { error: `Tiene ${count} OT(s) asignadas. Desactívalo en lugar de eliminarlo.` },
      { status: 400 }
    )
  }

  await prisma.tecnico.delete({ where: { id: numId } })
  return NextResponse.json({ ok: true })
}
