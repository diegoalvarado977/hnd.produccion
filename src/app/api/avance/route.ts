import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcHrsAvanceCapped } from '@/lib/calculos'

// GET /api/avance?semana=2026-05-25
export async function GET(req: Request) {
  const semana = new URL(req.url).searchParams.get('semana')
  if (!semana) return NextResponse.json({ error: 'Parámetro semana requerido' }, { status: 400 })

  const dayStart = new Date(semana + 'T00:00:00')
  const dayEnd   = new Date(semana + 'T23:59:59')

  const config = await prisma.config.findFirst()
  const factorMO   = Number(config?.factorMO   ?? 0.6)
  const tarifaHora = Number(config?.tarifaHora ?? 300)

  const ots = await prisma.oT.findMany({
    where: { estado: 'EN_PROCESO' },
    include: {
      tecnicos: { include: { tecnico: true }, orderBy: { posicion: 'asc' } },
      avances:  true,
    },
    orderBy: { fechaEntrada: 'asc' },
  })

  const result = ots.map((ot) => {
    const hrsCalc = Math.round(Number(ot.precio) * factorMO / tarifaHora * 100) / 100

    // Semanas anteriores a la seleccionada
    const hrsYaContadas = ot.avances
      .filter((a) => new Date(a.semanaInicio) < dayStart)
      .reduce((sum, a) => sum + Number(a.horasInvertidas), 0)

    const hrsDisponibles = Math.max(0, Math.round((hrsCalc - hrsYaContadas) * 100) / 100)

    // Avance registrado para esta semana (si existe)
    const avanceThisSemana = ot.avances.find(
      (a) => new Date(a.semanaInicio) >= dayStart && new Date(a.semanaInicio) <= dayEnd
    )
    const hrsEstaSemana = avanceThisSemana ? Number(avanceThisSemana.horasInvertidas) : 0

    return {
      id:              ot.id,
      numero:          ot.numero,
      unidad:          ot.unidad,
      tecnicos:        ot.tecnicos.map((t) => t.tecnico.nombre).join(' · '),
      hrsCalc,
      hrsYaContadas:   Math.round(hrsYaContadas * 100) / 100,
      hrsDisponibles,
      hrsEstaSemana,
      registrado:      !!avanceThisSemana,
    }
  })

  return NextResponse.json(result)
}

// POST /api/avance
export async function POST(req: Request) {
  const { semana, avances } = await req.json()
  const semanaInicio = new Date(semana + 'T12:00:00')

  type AvanceInput = { otId: number; hrsEstaSemana: number; hrsCalc: number; hrsYaContadas: number }

  await Promise.all(
    (avances as AvanceInput[])
      .filter((a) => a.hrsEstaSemana > 0)
      .map((a) => {
        const capped = calcHrsAvanceCapped(a.hrsEstaSemana, a.hrsCalc, a.hrsYaContadas)
        return prisma.avanceSemanal.upsert({
          where: { otId_semanaInicio: { otId: a.otId, semanaInicio } },
          update: { horasInvertidas: capped },
          create: { otId: a.otId, semanaInicio, horasInvertidas: capped },
        })
      })
  )

  return NextResponse.json({ ok: true })
}
