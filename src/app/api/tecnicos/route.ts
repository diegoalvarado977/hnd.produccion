export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET â€” todos (activos e inactivos) para config; solo activos para forms
export async function GET(req: Request) {
  const todos = new URL(req.url).searchParams.get('todos') === '1'
  const tecnicos = await prisma.tecnico.findMany({
    where: todos ? undefined : { activo: true },
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { ots: true } } },
  })
  return NextResponse.json(tecnicos)
}

export async function POST(req: Request) {
  const { nombre } = await req.json()
  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }
  try {
    const tecnico = await prisma.tecnico.create({
      data: { nombre: nombre.trim().toUpperCase() },
    })
    return NextResponse.json(tecnico, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ya existe un tÃ©cnico con ese nombre' }, { status: 409 })
  }
}

