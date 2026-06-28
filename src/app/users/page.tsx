"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/lib/confirm";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", nama: "", roleIds: [] as string[], pegawaiId: "" });

  async function fetchData() {
    const [ur, rr, pr] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
      fetch("/api/pegawai").then((r) => r.json()),
    ]);
    setUsers(ur.users);
    setRoles(rr.roles);
    setPegawai(pr.pegawai);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const body: any = { nama: form.nama, roleIds: form.roleIds, pegawaiId: form.pegawaiId || null };
      if (form.password) body.password = form.password;
      await fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ email: "", password: "", nama: "", roleIds: [], pegawaiId: "" });
    fetchData();
  }

  async function handleDelete(id: string, nama: string) {
    const ok = await confirmDelete(`user "${nama}"`);
    if (!ok) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    toast.success("User berhasil dihapus");
    fetchData();
  }

  function edit(item: any) {
    setEditing(item);
    setForm({
      email: item.email,
      password: "",
      nama: item.nama,
      roleIds: item.roles.map((r: any) => r.roleId),
      pegawaiId: item.pegawaiId || "",
    });
    setShowForm(true);
  }

  function toggleRole(roleId: string) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter((id) => id !== roleId)
        : [...f.roleIds, roleId],
    }));
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-navy">User Management</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ email: "", password: "", nama: "", roleIds: [], pegawaiId: "" }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white font-medium bg-navy hover:bg-navy-soft transition"
        >
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-4 mb-4 sm:mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required={!editing}
              disabled={!!editing}
            />
            <input
              placeholder={editing ? "Password (kosongkan jika tidak diganti)" : "Password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required={!editing}
            />
            <input
              placeholder="Nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={form.pegawaiId}
              onChange={(e) => setForm({ ...form, pegawaiId: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tidak terikat pegawai</option>
              {pegawai.map((p) => <option key={p.id} value={p.id}>{p.nama} ({p.nik})</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <label key={r.id} className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={form.roleIds.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                {r.nama}
              </label>
            ))}
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
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Email</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Nama</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap hidden sm:table-cell">Roles</th>
                <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-3 sm:px-4 py-2 text-xs">{u.email}</td>
                  <td className="px-3 sm:px-4 py-2 font-medium">{u.nama}</td>
                  <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((ur: any) => (
                        <span key={ur.roleId} className="text-[10px] bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                          {ur.role.nama}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => edit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.nama)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
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
