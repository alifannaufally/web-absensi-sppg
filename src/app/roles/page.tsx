"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/lib/confirm";

const ALL_PERMISSIONS = [
  "absen:read", "absen:write",
  "monitor:read", "monitor:export",
  "pegawai:read", "pegawai:write", "pegawai:delete",
  "divisi:read", "divisi:write", "divisi:delete",
  "user:read", "user:write", "user:delete",
  "role:read", "role:write", "role:delete",
];

const PERM_GROUPS: Record<string, { label: string; perms: string[] }> = {
  absen: { label: "Absensi", perms: [] },
  monitor: { label: "Monitor", perms: [] },
  pegawai: { label: "Pegawai", perms: [] },
  divisi: { label: "Divisi", perms: [] },
  user: { label: "User", perms: [] },
  role: { label: "Role", perms: [] },
};

for (const p of ALL_PERMISSIONS) {
  const [group] = p.split(":");
  PERM_GROUPS[group].perms.push(p);
}

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: "", permissions: [] as string[] });

  async function fetchRoles() {
    const res = await fetch("/api/roles");
    const json = await res.json();
    setRoles(json.roles);
  }

  useEffect(() => { fetchRoles(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/roles/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ nama: "", permissions: [] });
    fetchRoles();
  }

  async function handleDelete(id: string, nama: string) {
    const ok = await confirmDelete(`role "${nama}"`);
    if (!ok) return;
    await fetch(`/api/roles/${id}`, { method: "DELETE" });
    toast.success("Role berhasil dihapus");
    fetchRoles();
  }

  function edit(item: any) {
    setEditing(item);
    setForm({ nama: item.nama, permissions: item.permissions });
    setShowForm(true);
  }

  function togglePerm(p: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-navy">Role Management</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ nama: "", permissions: [] }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white font-medium bg-navy hover:bg-navy-soft transition"
        >
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-4 mb-4 sm:mb-6 space-y-3">
          <input
            placeholder="Nama Role"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm w-full"
            required
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(PERM_GROUPS).map(([key, group]) => (
              <div key={key}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{group.label}</p>
                <div className="space-y-1">
                  {group.perms.map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-xs border rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p)}
                        onChange={() => togglePerm(p)}
                      />
                      {p.split(":")[1]}
                    </label>
                  ))}
                </div>
              </div>
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
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">Nama Role</th>
                <th className="px-3 sm:px-4 py-2 text-left whitespace-nowrap hidden sm:table-cell">Permissions</th>
                <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-3 sm:px-4 py-2 font-medium">{r.nama}</td>
                  <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.includes("*") ? (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 font-medium">
                          * (Super Admin)
                        </span>
                      ) : (
                        r.permissions.map((p: string) => (
                          <span key={p} className="text-[10px] bg-gray-100 rounded-full px-2 py-0.5">{p}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => edit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(r.id, r.nama)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
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
