import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  calcHrsCalc, calcHrsAvanceCapped, calcCapacidad, CAPACIDAD_MAX,
  puntajeEficiencia, puntajeComeback, puntajeATiempo, puntajeManual, calcBono,
  type DiasSemana,
} from '@/lib/calculos'

// GET /api/reporte?semana=2026-05-25
export async function GET(req: Request) {
  const semana = new URL(req.url).searchParams.get('semana')
  if (!semana) return NextResponse.json({ error: 'Parámetro semana requerido' }, { status: 400 })

  const dayStart = new Date(semana + 'T00:00:00')
  const dayEnd   = new Date(semana + 'T23:59:59')
  const semFin   = new Date(dayStart)
  semFin.setDate(semFin.getDate() + 6)
  semFin.setHours(23, 59, 59, 999)

  const [config, allOTs, avances, asistencias, tecnicos, evaluacion] = await Promise.all([
    prisma.config.findFirst(),
    prisma.oT.findMany({ include: { avances: true } }),
    prisma.avanceSemanal.findMany({
      where: { semanaInicio: { gte: dayStart, lte: dayEnd } },
      include: { ot: true },
    }),
    prisma.asistenciaSemana.findMany({ where: { semanaInicio: { gte: dayStart, lte: dayEnd } } }),
    prisma.tecnico.findMany({ where: { activo: true } }),
    prisma.evaluacionManual.findFirst({ where: { semanaInicio: { gte: dayStart, lte: dayEnd } } }),
  ])

  const factorMO   = Number(config?.factorMO   ?? 0.6)
  const tarifaHora = Number(config?.tarifaHora ?? 300)

  // ── Semana actual: filtro por fechaEntrada ────────────────────────────────
  const otsRecibidas = allOTs.filter(
    (o) => o.fechaEntrada >= dayStart && o.fechaEntrada <= semFin
  )

  // ── Cerradas esta semana: filtro por fechaEntrega ─────────────────────────
  const otsCerradas = allOTs.filter(
    (o) => o.estado === 'CERRADA' && o.fechaEntrega && o.fechaEntrega >= dayStart && o.fechaEntrega <= semFin
  )

  // ── Comebacks recibidos esta semana ───────────────────────────────────────
  const comebacks = otsRecibidas.filter((o) => o.comeback).length

  // ── A tiempo ─────────────────────────────────────────────────────────────
  const otsATiempo = otsCerradas.filter((o) => o.aTiempo === true).length

  // ── Ventas ────────────────────────────────────────────────────────────────
  const ventas = otsCerradas.reduce((s, o) => s + Number(o.precio), 0)

  // ── Hrs Cerradas: HrsCalc por cada OT cerrada esta semana ────────────────
  const hrsCerradas = otsCerradas.reduce((s, o) => {
    return s + calcHrsCalc(Number(o.precio), factorMO, tarifaHora)
  }, 0)

  // ── Hrs En Proceso: avances de esta semana con cap ───────────────────────
  const hrsEnProceso = avances.reduce((s, av) => {
    const ot = allOTs.find((o) => o.id === av.otId)
    if (!ot) return s
    const hrsCalc = calcHrsCalc(Number(ot.precio), factorMO, tarifaHora)
    const hrsYaContadas = ot.avances
      .filter((a) => new Date(a.semanaInicio) < dayStart)
      .reduce((ss, a) => ss + Number(a.horasInvertidas), 0)
    const capped = calcHrsAvanceCapped(Number(av.horasInvertidas), hrsCalc, hrsYaContadas)
    return s + capped
  }, 0)

  // ── Capacidad ─────────────────────────────────────────────────────────────
  let capacidad: number
  if (asistencias.length > 0) {
    capacidad = asistencias.reduce((s, a) => {
      const dias: DiasSemana = {
        lunes: a.lunes, martes: a.martes, miercoles: a.miercoles,
        jueves: a.jueves, viernes: a.viernes, sabado: a.sabado,
      }
      return s + calcCapacidad(dias)
    }, 0)
  } else {
    capacidad = tecnicos.length * CAPACIDAD_MAX
  }

  // ── Métricas ──────────────────────────────────────────────────────────────
  const hrsProducidas = Math.round((hrsCerradas + hrsEnProceso) * 100) / 100
  const tasaComeback  = otsCerradas.length > 0 ? comebacks / otsCerradas.length : 0
  const tasaATiempo   = otsCerradas.length > 0 ? otsATiempo / otsCerradas.length : 0
  const eficiencia    = capacidad > 0 ? hrsProducidas / capacidad : 0

  // ── Puntajes bono ─────────────────────────────────────────────────────────
  const cfg = {
    eficienciaPiso:  Number(config?.eficienciaPiso  ?? 0.40),
    eficienciaTecho: Number(config?.eficienciaTecho ?? 0.75),
    comebackPiso:    Number(config?.comebackPiso    ?? 0.05),
    comebackTecho:   Number(config?.comebackTecho   ?? 0.25),
    aTiempoPiso:     Number(config?.aTiempoPiso     ?? 0.55),
    aTiempoTecho:    Number(config?.aTiempoTecho    ?? 0.85),
    pesoEficiencia:  config?.pesoEficiencia  ?? 30,
    pesoComeback:    config?.pesoComeback    ?? 20,
    pesoATiempo:     config?.pesoATiempo     ?? 20,
    pesoCabina:      config?.pesoCabina      ?? 10,
    pesoInventario:  config?.pesoInventario  ?? 10,
    pesoLimpieza:    config?.pesoLimpieza    ?? 10,
    bonoMaximo:      Number(config?.bonoMaximo ?? 2000),
  }

  const ptEfic  = puntajeEficiencia(eficiencia, cfg.eficienciaPiso, cfg.eficienciaTecho)
  const ptCB    = puntajeComeback(tasaComeback, cfg.comebackPiso, cfg.comebackTecho)
  const ptAT    = puntajeATiempo(tasaATiempo, cfg.aTiempoPiso, cfg.aTiempoTecho)
  const ptCab   = evaluacion ? puntajeManual(evaluacion.cabina)     : null
  const ptInv   = evaluacion ? puntajeManual(evaluacion.inventario) : null
  const ptLimp  = evaluacion ? puntajeManual(evaluacion.limpieza)   : null

  const ponderado = (pts: number | null, peso: number) =>
    pts !== null ? Math.round(pts * peso) / 100 : null

  const ptdEfic = ponderado(ptEfic, cfg.pesoEficiencia)
  const ptdCB   = ponderado(ptCB,   cfg.pesoComeback)
  const ptdAT   = ponderado(ptAT,   cfg.pesoATiempo)
  const ptdCab  = ponderado(ptCab,  cfg.pesoCabina)
  const ptdInv  = ponderado(ptInv,  cfg.pesoInventario)
  const ptdLimp = ponderado(ptLimp, cfg.pesoLimpieza)

  const manualesCompletos = ptCab !== null && ptInv !== null && ptLimp !== null
  const puntajeTotal = manualesCompletos
    ? Math.round(((ptdEfic ?? 0) + (ptdCB ?? 0) + (ptdAT ?? 0) + (ptdCab ?? 0) + (ptdInv ?? 0) + (ptdLimp ?? 0)) * 10) / 10
    : null

  const bono = puntajeTotal !== null ? calcBono(puntajeTotal, cfg.bonoMaximo) : null

  return NextResponse.json({
    semana,
    // Indicadores
    otsRecibidas: otsRecibidas.length,
    otsCerradas:  otsCerradas.length,
    comebacks,
    tasaComeback:  Math.round(tasaComeback * 1000) / 10,  // %
    otsATiempo,
    tasaATiempo:   Math.round(tasaATiempo * 1000) / 10,   // %
    ventas:        Math.round(ventas),
    ticketPromedio: otsCerradas.length > 0 ? Math.round(ventas / otsCerradas.length) : 0,
    hrsCerradas:   Math.round(hrsCerradas * 10) / 10,
    hrsEnProceso:  Math.round(hrsEnProceso * 10) / 10,
    hrsProducidas: Math.round(hrsProducidas * 10) / 10,
    capacidad:     Math.round(capacidad * 10) / 10,
    eficiencia:    Math.round(eficiencia * 1000) / 10,    // %
    // Evaluación manual
    evaluacion: evaluacion ? {
      cabina: evaluacion.cabina, inventario: evaluacion.inventario, limpieza: evaluacion.limpieza, notas: evaluacion.notas,
    } : null,
    // Bono
    puntajes: {
      eficiencia: { pts: ptEfic, pond: ptdEfic, peso: cfg.pesoEficiencia, resultado: `${(eficiencia * 100).toFixed(1)}%` },
      comeback:   { pts: ptCB,   pond: ptdCB,   peso: cfg.pesoComeback,   resultado: `${(tasaComeback * 100).toFixed(1)}%` },
      aTiempo:    { pts: ptAT,   pond: ptdAT,   peso: cfg.pesoATiempo,    resultado: `${(tasaATiempo * 100).toFixed(1)}%` },
      cabina:     { pts: ptCab,  pond: ptdCab,  peso: cfg.pesoCabina,     resultado: evaluacion?.cabina ?? null },
      inventario: { pts: ptInv,  pond: ptdInv,  peso: cfg.pesoInventario, resultado: evaluacion?.inventario ?? null },
      limpieza:   { pts: ptLimp, pond: ptdLimp, peso: cfg.pesoLimpieza,   resultado: evaluacion?.limpieza ?? null },
    },
    puntajeTotal,
    bono,
    manualesCompletos,
    // Rangos para tooltips
    rangos: {
      eficiencia: { piso: cfg.eficienciaPiso * 100, techo: cfg.eficienciaTecho * 100 },
      comeback:   { piso: cfg.comebackPiso   * 100, techo: cfg.comebackTecho   * 100 },
      aTiempo:    { piso: cfg.aTiempoPiso    * 100, techo: cfg.aTiempoTecho    * 100 },
    },
  })
}
