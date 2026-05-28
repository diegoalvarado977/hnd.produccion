// Control tests — src/lib/calculos.ts
// Run: node tests/calculos.test.mjs

let ok = 0, fail = 0

function assert(label, got, expected) {
  const pass = Math.abs(got - expected) < 0.01
  if (pass) {
    console.log(`  ✓  ${label}`)
    ok++
  } else {
    console.log(`  ✗  ${label} → esperado ${expected}, obtenido ${got}`)
    fail++
  }
}

function section(title) {
  console.log(`\n${title}`)
  console.log('─'.repeat(50))
}

// ── Inline implementations (mirror de calculos.ts) ────────────────────────────

function calcHrsCalc(precio, factorMO, tarifaHora) {
  return Math.round(precio * factorMO / tarifaHora * 100) / 100
}

function calcHrsAvanceCapped(horasInvertidas, hrsCalc, horasYaContadas) {
  return Math.min(horasInvertidas, Math.max(0, hrsCalc - horasYaContadas))
}

function puntajeEficiencia(val, piso, techo) {
  return Math.max(0, Math.min(100, Math.round((val - piso) / (techo - piso) * 1000) / 10))
}

function puntajeComeback(tasa, techo) {
  return Math.max(0, Math.min(100, Math.round((1 - tasa / techo) * 1000) / 10))
}

function puntajeATiempo(tasa, piso, techo) {
  return Math.max(0, Math.min(100, Math.round((tasa - piso) / (techo - piso) * 1000) / 10))
}

function puntajeManual(calificacion) { return calificacion * 10 }

function calcBono(puntajeTotal, bonoMaximo) {
  return Math.round(puntajeTotal / 100 * bonoMaximo)
}

function inicioSemana(fecha) {
  const d = new Date(fecha)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function finSemana(inicio) {
  const d = new Date(inicio)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
section('1. calcHrsCalc — horas estimadas por OT')
assert('Precio $3,000 → 6 hrs',  calcHrsCalc(3000, 0.6, 300),  6)
assert('Precio $4,500 → 9 hrs',  calcHrsCalc(4500, 0.6, 300),  9)
assert('Precio $1,500 → 3 hrs',  calcHrsCalc(1500, 0.6, 300),  3)
assert('Precio $500  → 1 hr',    calcHrsCalc(500,  0.6, 300),  1)
assert('Precio $0    → 0 hrs',   calcHrsCalc(0,    0.6, 300),  0)

section('2. calcHrsAvanceCapped — lógica de cap semanal (Diego\'s concept)')
assert('Sem 1: invierte 7 de 10 disponibles → 7',   calcHrsAvanceCapped(7, 10, 0),   7)
assert('Sem 2: invierte 5, quedan 3 → cap en 3',     calcHrsAvanceCapped(5, 10, 7),   3)
assert('Sem 2: invierte 2, quedan 3 → acepta 2',     calcHrsAvanceCapped(2, 10, 7),   2)
assert('Sem 3: invierte 4, ya no quedan → 0',        calcHrsAvanceCapped(4, 10, 10),  0)
assert('Sem 1: invierte exacto 10 → 10',             calcHrsAvanceCapped(10, 10, 0),  10)
assert('Invierte más de lo disponible → cap exacto', calcHrsAvanceCapped(15, 10, 0),  10)

section('3. puntajeEficiencia (piso=40%, techo=75%)')
assert('40% → 0 pts (en el piso)',    puntajeEficiencia(0.40, 0.40, 0.75), 0)
assert('75% → 100 pts (en el techo)', puntajeEficiencia(0.75, 0.40, 0.75), 100)
assert('57.5% → 50 pts (punto medio)',puntajeEficiencia(0.575,0.40, 0.75), 50)
assert('30% → 0 pts (bajo el piso)',  puntajeEficiencia(0.30, 0.40, 0.75), 0)
assert('90% → 100 pts (sobre techo)', puntajeEficiencia(0.90, 0.40, 0.75), 100)
assert('40.3% → 0.9 pts (test data)', puntajeEficiencia(0.403,0.40, 0.75), 0.9)

section('4. puntajeComeback (techo=10%)')
assert('0% → 100 pts (cero comebacks)',     puntajeComeback(0,    0.10), 100)
assert('5% → 50 pts (mitad del rango)',     puntajeComeback(0.05, 0.10),  50)
assert('10% → 0 pts (en el techo)',         puntajeComeback(0.10, 0.10),   0)
assert('14.3% → 0 pts (sobre el techo)',    puntajeComeback(0.143,0.10),   0)
assert('2% → 80 pts',                       puntajeComeback(0.02, 0.10),  80)

section('5. puntajeATiempo (piso=55%, techo=85%)')
assert('55% → 0 pts (en el piso)',    puntajeATiempo(0.55, 0.55, 0.85),   0)
assert('85% → 100 pts (en el techo)', puntajeATiempo(0.85, 0.55, 0.85), 100)
assert('70% → 50 pts (punto medio)',  puntajeATiempo(0.70, 0.55, 0.85),  50)
assert('42.9% → 0 pts (test data)',   puntajeATiempo(0.429,0.55, 0.85),   0)
assert('100% → 100 pts (cap)',        puntajeATiempo(1.00, 0.55, 0.85), 100)

section('6. puntajeManual (calificación 1-10 → pts 0-100)')
assert('Cal. 10 → 100 pts', puntajeManual(10), 100)
assert('Cal. 8  → 80 pts',  puntajeManual(8),   80)
assert('Cal. 7  → 70 pts',  puntajeManual(7),   70)
assert('Cal. 5  → 50 pts',  puntajeManual(5),   50)
assert('Cal. 1  → 10 pts',  puntajeManual(1),   10)

section('7. calcBono — integración con datos reales del Excel')
// Test data semana 12-18 may (post-fix): puntaje=23.3
assert('Puntaje 43.0 → $860 (pre-fix)',  calcBono(43.0,  2000), 860)
assert('Puntaje 23.3 → $466 (post-fix)', calcBono(23.3,  2000), 466)
assert('Puntaje 100  → $2,000 (máximo)', calcBono(100,   2000), 2000)
assert('Puntaje 0    → $0 (mínimo)',     calcBono(0,     2000),    0)
assert('Puntaje 50   → $1,000',          calcBono(50,    2000), 1000)

section('8. inicioSemana / finSemana')
const lunes = inicioSemana(new Date('2026-05-14T12:00:00')) // jueves → busca lunes
const domFin = finSemana(lunes)
console.log(`  Semana de 2026-05-14: ${lunes.toISOString().split('T')[0]} → ${domFin.toISOString().split('T')[0]}`)
assert('Inicio es lunes (día=1)', lunes.getDay(), 1)
assert('Fin es domingo (día=0)',  domFin.getDay(), 0)
assert('Diferencia = 6 días completos', Math.floor((domFin - lunes) / (1000*60*60*24)), 6)

const lunesDesdeMartes = inicioSemana(new Date('2026-05-12T00:00:00')) // martes
assert('May 12 (martes) → inicio semana = May 11 (lunes)', lunesDesdeMartes.getDate(), 11)

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULTADO: ${ok} OK / ${fail} FALLIDOS`)
if (fail > 0) process.exit(1)
