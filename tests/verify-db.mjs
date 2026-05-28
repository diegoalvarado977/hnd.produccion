import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

const [cfg, tecs] = await Promise.all([
  p.config.findFirst(),
  p.tecnico.findMany({ orderBy: { id: 'asc' } }),
])

console.log('=== Config ===')
console.log(`  hrsPorSemana: ${cfg.hrsPorSemana}`)
console.log(`  factorMO:     ${cfg.factorMO}`)
console.log(`  tarifaHora:   ${cfg.tarifaHora}`)
console.log(`  bonoMaximo:   ${cfg.bonoMaximo}`)
console.log(`  pesoEficiencia/Comeback/ATiempo: ${cfg.pesoEficiencia}% / ${cfg.pesoComeback}% / ${cfg.pesoATiempo}%`)

console.log('\n=== Técnicos ===')
for (const t of tecs) {
  console.log(`  [${t.id}] ${t.nombre} — activo: ${t.activo}`)
}

await p.$disconnect()
