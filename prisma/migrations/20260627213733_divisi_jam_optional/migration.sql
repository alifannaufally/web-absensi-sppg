-- DropIndex
DROP INDEX "Divisi_nama_idx";

-- AlterTable
ALTER TABLE "Divisi" ALTER COLUMN "jamMasuk" DROP NOT NULL,
ALTER COLUMN "jamPulang" DROP NOT NULL;
