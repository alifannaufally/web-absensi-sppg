-- CreateEnum
CREATE TYPE "StatusKehadiran" AS ENUM ('HADIR', 'IZIN', 'ALPHA');

-- CreateTable
CREATE TABLE "Divisi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isPantau" BOOLEAN NOT NULL DEFAULT false,
    "jamMasuk" TEXT NOT NULL,
    "jamPulang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Divisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pegawai" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "divisiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusKehadiran" NOT NULL,
    "jamMasuk" TEXT,
    "jamPulang" TEXT,
    "dicatatOleh" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nik_key" ON "Pegawai"("nik");

-- CreateIndex
CREATE INDEX "Absensi_tanggal_idx" ON "Absensi"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_pegawaiId_tanggal_key" ON "Absensi"("pegawaiId", "tanggal");

-- AddForeignKey
ALTER TABLE "Pegawai" ADD CONSTRAINT "Pegawai_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "Divisi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;
