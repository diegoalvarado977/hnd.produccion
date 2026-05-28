/*
  Warnings:

  - You are about to drop the column `diasTrabajados` on the `AsistenciaSemana` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AsistenciaSemana" DROP COLUMN "diasTrabajados",
ADD COLUMN     "jueves" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lunes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "martes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "miercoles" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sabado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "viernes" BOOLEAN NOT NULL DEFAULT true;
