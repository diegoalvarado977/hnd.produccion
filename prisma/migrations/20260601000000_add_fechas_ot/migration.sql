-- RenameColumn
ALTER TABLE "OT" RENAME COLUMN "fechaEntrega" TO "fechaRecoleccion";

-- AlterTable
ALTER TABLE "OT" ADD COLUMN "fechaAutorizacion" TIMESTAMP(3),
                 ADD COLUMN "fechaFinalizacion" TIMESTAMP(3);
