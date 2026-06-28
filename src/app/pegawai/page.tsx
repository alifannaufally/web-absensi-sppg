"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/lib/confirm";

export default function PegawaiPage() {
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [divisi, setDivisi] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nik: "", nama: "", divisiId: "" });
  const [showForm, setShowForm] = useState(false);

  async function fetchPegawai() {
    const [pr, dr] = await Promise.all([
      fetch("/api/pegawai").then((r) => r.json()),
      fetch("/api/divisi").then((r) => r.json()),
    ]);
    setPegawai(pr.pegawai);
    setDivisi(dr.divisi);
  }

  useEffect(() => { fetchPegawai(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/pegawai/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/pegawai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ nik: "", nama: "", divisiId: "" });
    fetchPegawai();
  }

  async function handleDelete(id: string, nama: string) {
    const ok = await confirmDelete(`pegawai "${nama}"`);
    if (!ok) return;
    await fetch(`/api/pegawai/${id}`, { method: "DELETE" });
    toast.success("Pegawai berhasil dihapus");
    fetchPegawai();
  }

  function edit(item: any) {
    setEditing(item);
    setForm({ nik: item.nik, nama: item.nama, divisiId: item.divisiId });
    setShowForm(true);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-navy">Data Pegawai</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ nik: "", nama: "", divisiId: "" }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white font-medium bg-navy hover:bg-navy-soft transition"
        >
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-4 mb-4 sm:mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="NIK"
              value={form.nik}
              onChange={(e) => setForm({ ...form, nik: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={form.divisiId}
              onChange={(e) => setForm({ ...form, divisiId: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              required
            >
              <option value="">Pilih Divisi</option>
              {divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 rounded-lg text-sm text-white bg-navy hover:bg-navy-soft transition">
              {editing ? "Simpan" : "Tambah"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded-lg text-sm border hover:bg-gray-50 transition">
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b bg-gold text-navy">
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">NIK</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Nama</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap hidden sm:table-cell">Divisi</th>
                <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pegawai.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs">{p.nik}</td>
                  <td className="px-3 sm:px-4 py-2 font-medium">{p.nama}</td>
                  <td className="px-3 sm:px-4 py-2 text-xs text-gray-500 hidden sm:table-cell">{p.divisi?.nama}</td>
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => edit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.nama)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
