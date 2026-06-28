-- CreateIndex
CREATE INDEX "Absensi_pegawaiId_idx" ON "Absensi"("pegawaiId");

-- CreateIndex
CREATE INDEX "Divisi_nama_idx" ON "Divisi"("nama");

-- CreateIndex
CREATE INDEX "Pegawai_divisiId_idx" ON "Pegawai"("divisiId");

-- CreateIndex
CREATE INDEX "Pegawai_nama_idx" ON "Pegawai"("nama");
