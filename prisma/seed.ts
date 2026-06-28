import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = [
    { id: "role-admin", nama: "Admin", permissions: ["*"] },
    { id: "role-security", nama: "Security", permissions: ["absen:read", "absen:write"] },
    { id: "role-pemantau", nama: "Pemantau", permissions: ["monitor:read", "monitor:export"] },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { permissions: r.permissions },
      create: r,
    });
  }

  const adminPw = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@sppg.com" },
    update: {},
    create: {
      email: "admin@sppg.com",
      password: adminPw,
      nama: "Admin SPPG",
      roles: { create: { roleId: "role-admin" } },
    },
  });

  const securityPw = await bcrypt.hash("security123", 12);
  await prisma.user.upsert({
    where: { email: "security@sppg.com" },
    update: {},
    create: {
      email: "security@sppg.com",
      password: securityPw,
      nama: "Security Pos",
      roles: { create: { roleId: "role-security" } },
    },
  });

  const korlap = await prisma.divisi.upsert({
    where: { id: "div-korlap" },
    update: {},
    create: { id: "div-korlap", nama: "Korlap", isPantau: true, jamMasuk: "06:00", jamPulang: "18:00" },
  });
  const akuntan = await prisma.divisi.upsert({
    where: { id: "div-akuntan" },
    update: {},
    create: { id: "div-akuntan", nama: "Akuntan", isPantau: true, jamMasuk: "07:00", jamPulang: "16:00" },
  });
  const kaSppg = await prisma.divisi.upsert({
    where: { id: "div-ka-sppg" },
    update: {},
    create: { id: "div-ka-sppg", nama: "Ka SPPG", isPantau: true, jamMasuk: "06:00", jamPulang: "18:00" },
  });
  const juruMasak = await prisma.divisi.upsert({
    where: { id: "div-juru-masak" },
    update: {},
    create: { id: "div-juru-masak", nama: "Juru Masak", isPantau: false, jamMasuk: "03:00", jamPulang: "10:00" },
  });
  const helper = await prisma.divisi.upsert({
    where: { id: "div-helper" },
    update: {},
    create: { id: "div-helper", nama: "Helper", isPantau: false, jamMasuk: "03:00", jamPulang: "10:00" },
  });

  const pegawais = [
    { nik: "K001", nama: "Ahmad Fauzi", divisiId: korlap.id },
    { nik: "K002", nama: "Siti Rahmawati", divisiId: akuntan.id },
    { nik: "K003", nama: "Bambang Supriyadi", divisiId: kaSppg.id },
    { nik: "JM001", nama: "Joko Susilo", divisiId: juruMasak.id },
    { nik: "JM002", nama: "Agus Prasetyo", divisiId: juruMasak.id },
    { nik: "JM003", nama: "Dewi Sartika", divisiId: juruMasak.id },
    { nik: "H001", nama: "Rudi Hartono", divisiId: helper.id },
    { nik: "H002", nama: "Maya Indah", divisiId: helper.id },
  ];

  for (const p of pegawais) {
    await prisma.pegawai.upsert({
      where: { nik: p.nik },
      update: {},
      create: p,
    });
  }

  console.log("Seed selesai. Admin: admin@sppg.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
