-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('PARTICULAR', 'FLOTILLA');

-- CreateEnum
CREATE TYPE "EstadoOT" AS ENUM ('EN_PROCESO', 'CERRADA');

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "hrsPorSemana" DECIMAL(65,30) NOT NULL DEFAULT 47.5,
    "factorMO" DECIMAL(65,30) NOT NULL DEFAULT 0.6,
    "tarifaHora" DECIMAL(65,30) NOT NULL DEFAULT 300,
    "eficienciaPiso" DECIMAL(65,30) NOT NULL DEFAULT 0.40,
    "eficienciaTecho" DECIMAL(65,30) NOT NULL DEFAULT 0.75,
    "comebackTecho" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "aTiempoPiso" DECIMAL(65,30) NOT NULL DEFAULT 0.55,
    "aTiempoTecho" DECIMAL(65,30) NOT NULL DEFAULT 0.85,
    "pesoEficiencia" INTEGER NOT NULL DEFAULT 30,
    "pesoComeback" INTEGER NOT NULL DEFAULT 20,
    "pesoATiempo" INTEGER NOT NULL DEFAULT 20,
    "pesoCabina" INTEGER NOT NULL DEFAULT 10,
    "pesoInventario" INTEGER NOT NULL DEFAULT 10,
    "pesoLimpieza" INTEGER NOT NULL DEFAULT 10,
    "bonoMaximo" DECIMAL(65,30) NOT NULL DEFAULT 2000,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tecnico" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OT" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "tipoCliente" "TipoCliente" NOT NULL,
    "estado" "EstadoOT" NOT NULL DEFAULT 'EN_PROCESO',
    "comeback" BOOLEAN NOT NULL DEFAULT false,
    "fechaEntrada" TIMESTAMP(3) NOT NULL,
    "fechaPromesa" TIMESTAMP(3) NOT NULL,
    "fechaEntrega" TIMESTAMP(3),
    "aTiempo" BOOLEAN,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTTecnico" (
    "id" SERIAL NOT NULL,
    "otId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "posicion" INTEGER NOT NULL,
    "horas" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OTTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvanceSemanal" (
    "id" SERIAL NOT NULL,
    "otId" INTEGER NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "horasInvertidas" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "AvanceSemanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsistenciaSemana" (
    "id" SERIAL NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "diasTrabajados" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "AsistenciaSemana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionManual" (
    "id" SERIAL NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "cabina" INTEGER NOT NULL,
    "inventario" INTEGER NOT NULL,
    "limpieza" INTEGER NOT NULL,
    "notas" TEXT,

    CONSTRAINT "EvaluacionManual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tecnico_nombre_key" ON "Tecnico"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "OT_numero_key" ON "OT"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "OTTecnico_otId_posicion_key" ON "OTTecnico"("otId", "posicion");

-- CreateIndex
CREATE UNIQUE INDEX "AvanceSemanal_otId_semanaInicio_key" ON "AvanceSemanal"("otId", "semanaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "AsistenciaSemana_tecnicoId_semanaInicio_key" ON "AsistenciaSemana"("tecnicoId", "semanaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionManual_semanaInicio_key" ON "EvaluacionManual"("semanaInicio");

-- AddForeignKey
ALTER TABLE "OTTecnico" ADD CONSTRAINT "OTTecnico_otId_fkey" FOREIGN KEY ("otId") REFERENCES "OT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTTecnico" ADD CONSTRAINT "OTTecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvanceSemanal" ADD CONSTRAINT "AvanceSemanal_otId_fkey" FOREIGN KEY ("otId") REFERENCES "OT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaSemana" ADD CONSTRAINT "AsistenciaSemana_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
