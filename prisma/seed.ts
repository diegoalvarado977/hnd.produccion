import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  // Config global del taller
  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: {
      hrsPorSemana:   47.5,
      factorMO:       0.6,
      tarifaHora:     300,
      eficienciaPiso: 0.40,
      eficienciaTecho:0.75,
      comebackPiso:   0.05,
      comebackTecho:  0.25,
      aTiempoPiso:    0.55,
      aTiempoTecho:   0.85,
      pesoEficiencia: 30,
      pesoComeback:   20,
      pesoATiempo:    20,
      pesoCabina:     10,
      pesoInventario: 10,
      pesoLimpieza:   10,
      bonoMaximo:     2000,
    },
  })
  console.log('  ✓ Config')

  // Técnicos Taller Cumbres
  const tecnicos = [
    'CESAR',
    'YAHIR',
    'ASAEL',
    'FRANCISCO',
    'FRANCISCO JR',
    'KEVIN',
  ]

  for (const nombre of tecnicos) {
    await prisma.tecnico.upsert({
      where:  { nombre },
      update: {},
      create: { nombre, activo: true },
    })
    console.log(`  ✓ Técnico: ${nombre}`)
  }

  console.log('\nSeed completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
