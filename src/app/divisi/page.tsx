"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/lib/confirm";

export default function DivisiPage() {
  const [divisi, setDivisi] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nama: "", isPantau: false, jamMasuk: "", jamPulang: "" });
  const [showForm, setShowForm] = useState(false);

  async function fetchDivisi() {
    const res = await fetch("/api/divisi");
    const json = await res.json();
    setDivisi(json.divisi);
  }

  useEffect(() => { fetchDivisi(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/divisi/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/divisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ nama: "", isPantau: false, jamMasuk: "", jamPulang: "" });
    fetchDivisi();
  }

  async function handleDelete(id: string, nama: string) {
    const ok = await confirmDelete(`divisi "${nama}"`);
    if (!ok) return;
    const res = await fetch(`/api/divisi/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error((await res.json()).error); return; }
    toast.success("Divisi berhasil dihapus");
    fetchDivisi();
  }

  function edit(item: any) {
    setEditing(item);
    setForm({ nama: item.nama, isPantau: item.isPantau, jamMasuk: item.jamMasuk || "", jamPulang: item.jamPulang || "" });
    setShowForm(true);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-navy">Kelola Divisi</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ nama: "", isPantau: false, jamMasuk: "", jamPulang: "" }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white font-medium bg-navy hover:bg-navy-soft transition"
        >
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-4 mb-4 sm:mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              placeholder="Nama Divisi"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="time"
              value={form.jamMasuk}
              onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Jam masuk (opsional)"
            />
            <input
              type="time"
              value={form.jamPulang}
              onChange={(e) => setForm({ ...form, jamPulang: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Jam pulang (opsional)"
            />
            <label className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={form.isPantau}
                onChange={(e) => setForm({ ...form, isPantau: e.target.checked })}
              />
              <span>Pemantau</span>
            </label>
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
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Nama</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Jam Masuk</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Jam Pulang</th>
                <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Pemantau</th>
                <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap hidden sm:table-cell">Pegawai</th>
                <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {divisi.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-3 sm:px-4 py-2 font-medium">{d.nama}</td>
                  <td className="px-3 sm:px-4 py-2 text-xs">{d.jamMasuk || <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 sm:px-4 py-2 text-xs">{d.jamPulang || <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 sm:px-4 py-2 text-center">
                    {d.isPantau
                      ? <span className="text-green-600 font-bold text-sm">✓</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 sm:px-4 py-2 text-center text-xs text-gray-500 hidden sm:table-cell">{d._count?.pegawai || 0}</td>
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => edit(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(d.id, d.nama)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
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
