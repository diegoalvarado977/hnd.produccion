export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const config = await prisma.config.findFirst()
  return NextResponse.json(config)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const config = await prisma.config.upsert({
    where:  { id: 1 },
    update: body,
    create: { id: 1, ...body },
  })
  return NextResponse.json(config)
}

