import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcHrsCalc, calcHrsAvanceCapped, calcCapacidad, CAPACIDAD_MAX, DIAS_DEFAULT, type DiasSemana } from '@/lib/calculos'

// GET /api/dashboard?semana=2026-05-25
export async function GET(req: Request) {
  const semana = new URL(req.url).searchParams.get('semana')
  if (!semana) return NextResponse.json({ error: 'Parámetro semana requerido' }, { status: 400 })

  const dayStart = new Date(semana + 'T00:00:00')
  const semFin   = new Date(dayStart)
  semFin.setDate(semFin.getDate() + 6)
  semFin.setHours(23, 59, 59, 999)

  const [config, tecnicos, allOTs, avancesSemana, asistencias] = await Promise.all([
    prisma.config.findFirst(),
    prisma.tecnico.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
    prisma.oT.findMany({
      include: {
        tecnicos: true,
        avances:  true,
      },
    }),
    prisma.avanceSemanal.findMany({
      where: { semanaInicio: { gte: dayStart, lte: new Date(semana + 'T23:59:59') } },
    }),
    prisma.asistenciaSemana.findMany({
      where: { semanaInicio: { gte: dayStart, lte: new Date(semana + 'T23:59:59') } },
    }),
  ])

  const factorMO   = Number(config?.factorMO   ?? 0.6)
  const tarifaHora = Number(config?.tarifaHora ?? 300)

  // OTs cerradas esta semana (por fechaEntrega)
  const otsCerradasSemana = allOTs.filter(
    (o) => o.estado === 'CERRADA' && o.fechaEntrega && o.fechaEntrega >= dayStart && o.fechaEntrega <= semFin
  )

  // OTs recibidas esta semana (por fechaEntrada)
  const otsRecibidasSemana = allOTs.filter(
    (o) => o.fechaEntrada >= dayStart && o.fechaEntrada <= semFin
  )

  // OTs en proceso con avance esta semana
  const otsConAvance = allOTs.filter((o) =>
    avancesSemana.some((a) => a.otId === o.id)
  )

  const result = tecnicos.map((tec) => {
    // ── OTs asignadas esta semana ──────────────────────────────────────────
    const otsAsignadas = otsRecibidasSemana.filter(
      (o) => o.tecnicos.some((t) => t.tecnicoId === tec.id)
    ).length

    // ── OTs cerradas esta semana donde participó ───────────────────────────
    const otsCerradas = otsCerradasSemana.filter(
      (o) => o.tecnicos.some((t) => t.tecnicoId === tec.id)
    ).length

    // ── Comebacks recibidos esta semana donde participó ────────────────────
    const comebacks = otsRecibidasSemana.filter(
      (o) => o.comeback && o.tecnicos.some((t) => t.tecnicoId === tec.id)
    ).length

    // ── Hrs de OTs CERRADAS (proporción) ──────────────────────────────────
    let hrsCerradas = 0
    for (const ot of otsCerradasSemana) {
      const tecAsig = ot.tecnicos.find((t) => t.tecnicoId === tec.id)
      if (!tecAsig) continue
      const totalHoras = ot.tecnicos.reduce((s, t) => s + Number(t.horas), 0)
      if (totalHoras === 0) continue
      const hrsCalc = calcHrsCalc(Number(ot.precio), factorMO, tarifaHora)
      hrsCerradas += hrsCalc * (Number(tecAsig.horas) / totalHoras)
    }

    // ── Hrs de OTs EN PROCESO esta semana (proporción del avance capped) ──
    let hrsEnProceso = 0
    for (const ot of otsConAvance) {
      const tecAsig = ot.tecnicos.find((t) => t.tecnicoId === tec.id)
      if (!tecAsig) continue
      const totalHoras = ot.tecnicos.reduce((s, t) => s + Number(t.horas), 0)
      if (totalHoras === 0) continue
      const av = avancesSemana.find((a) => a.otId === ot.id)
      if (!av) continue
      const hrsCalc = calcHrsCalc(Number(ot.precio), factorMO, tarifaHora)
      const hrsYaContadas = ot.avances
        .filter((a) => new Date(a.semanaInicio) < dayStart)
        .reduce((s, a) => s + Number(a.horasInvertidas), 0)
      const capped = calcHrsAvanceCapped(Number(av.horasInvertidas), hrsCalc, hrsYaContadas)
      hrsEnProceso += capped * (Number(tecAsig.horas) / totalHoras)
    }

    // ── Capacidad según asistencia ─────────────────────────────────────────
    const asist = asistencias.find((a) => a.tecnicoId === tec.id)
    const dias: DiasSemana = asist
      ? { lunes: asist.lunes, martes: asist.martes, miercoles: asist.miercoles,
          jueves: asist.jueves, viernes: asist.viernes, sabado: asist.sabado }
      : { ...DIAS_DEFAULT }
    const capacidad = calcCapacidad(dias)

    const hrsProducidas = hrsCerradas + hrsEnProceso
    const eficiencia    = capacidad > 0 ? hrsProducidas / capacidad : 0

    return {
      id:           tec.id,
      nombre:       tec.nombre,
      otsAsignadas,
      otsCerradas,
      comebacks,
      hrsCerradas:   Math.round(hrsCerradas   * 10) / 10,
      hrsEnProceso:  Math.round(hrsEnProceso  * 10) / 10,
      hrsProducidas: Math.round(hrsProducidas * 10) / 10,
      diasAsist: [
        dias.lunes, dias.martes, dias.miercoles,
        dias.jueves, dias.viernes, dias.sabado,
      ],
      capacidad:    Math.round(capacidad  * 10) / 10,
      eficiencia:   Math.round(eficiencia * 1000) / 10,  // %
    }
  })

  return NextResponse.json(result)
}
