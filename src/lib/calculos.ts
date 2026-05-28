// ─── Horario HND Cumbres ──────────────────────────────────────────────────────
export const HRS_SEMANA = 8.5   // lunes a viernes
export const HRS_SABADO = 5.0   // sábado
export const CAPACIDAD_MAX = 5 * HRS_SEMANA + HRS_SABADO  // 47.5

export type DiasSemana = {
  lunes: boolean; martes: boolean; miercoles: boolean
  jueves: boolean; viernes: boolean; sabado: boolean
}

export const DIAS_DEFAULT: DiasSemana = {
  lunes: true, martes: true, miercoles: true,
  jueves: true, viernes: true, sabado: true,
}

export function calcCapacidad(dias: DiasSemana): number {
  return (
    (dias.lunes     ? HRS_SEMANA : 0) +
    (dias.martes    ? HRS_SEMANA : 0) +
    (dias.miercoles ? HRS_SEMANA : 0) +
    (dias.jueves    ? HRS_SEMANA : 0) +
    (dias.viernes   ? HRS_SEMANA : 0) +
    (dias.sabado    ? HRS_SABADO : 0)
  )
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ConfigCalculo = {
  hrsPorSemana: number
  factorMO: number
  tarifaHora: number
  eficienciaPiso: number
  eficienciaTecho: number
  comebackTecho: number
  aTiempoPiso: number
  aTiempoTecho: number
  pesoEficiencia: number
  pesoComeback: number
  pesoATiempo: number
  pesoCabina: number
  pesoInventario: number
  pesoLimpieza: number
  bonoMaximo: number
}

export type KPIs = {
  otsRecibidas: number
  otsCerradas: number
  comebacks: number
  tasaComeback: number
  otsATiempo: number
  tasaATiempo: number
  ventas: number
  ticketPromedio: number
  hrsCerradas: number
  hrsEnProceso: number        // horas de OTs en proceso (lógica de avance)
  hrsProducidas: number       // hrsCerradas + hrsEnProceso
  capacidad: number
  eficiencia: number          // hrsProducidas / capacidad
  // bono
  puntajeEficiencia: number
  puntajeComeback: number
  puntajeATiempo: number
  puntajeCabina: number
  puntajeInventario: number
  puntajeLimpieza: number
  puntajeTotal: number
  bono: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calcHrsCalc(precio: number, factorMO: number, tarifaHora: number): number {
  return Math.round(precio * factorMO / tarifaHora * 100) / 100
}

// Horas que le quedan disponibles a una OT en proceso
// = hrsCalc - suma de horas ya contadas en semanas anteriores
export function calcHrsAvanceCapped(
  horasInvertidas: number,
  hrsCalc: number,
  horasYaContadas: number
): number {
  return Math.min(horasInvertidas, Math.max(0, hrsCalc - horasYaContadas))
}

// ─── Puntajes bono (0-100) ────────────────────────────────────────────────────

export function puntajeEficiencia(val: number, piso: number, techo: number): number {
  return Math.max(0, Math.min(100, Math.round((val - piso) / (techo - piso) * 1000) / 10))
}

// piso = tasa excelente (≤ piso → 100 pts)
// techo = tasa inaceptable (≥ techo → 0 pts)
export function puntajeComeback(tasa: number, piso: number, techo: number): number {
  return Math.max(0, Math.min(100, Math.round((techo - tasa) / (techo - piso) * 1000) / 10))
}

export function puntajeATiempo(tasa: number, piso: number, techo: number): number {
  return Math.max(0, Math.min(100, Math.round((tasa - piso) / (techo - piso) * 1000) / 10))
}

export function puntajeManual(calificacion: number): number {
  return calificacion * 10
}

export function calcBono(puntajeTotal: number, bonoMaximo: number): number {
  return Math.round(puntajeTotal / 100 * bonoMaximo)
}

// ─── Semanas ──────────────────────────────────────────────────────────────────

export function inicioSemana(fecha: Date): Date {
  const d = new Date(fecha)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia  // lunes como inicio
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function finSemana(inicio: Date): Date {
  const d = new Date(inicio)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

export function semanaLabel(inicio: Date): string {
  const fin = finSemana(inicio)
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  return `${fmt(inicio)} – ${fmt(fin)} ${fin.getFullYear()}`
}
