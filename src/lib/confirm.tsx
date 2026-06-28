import { toast } from "sonner";

export function confirmDelete(label: string): Promise<boolean> {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className="bg-white rounded-xl shadow-xl border p-4 max-w-xs w-full">
          <p className="text-sm font-medium text-gray-900 mb-1">Yakin hapus?</p>
          <p className="text-xs text-gray-500 mb-3">
            Data <span className="font-semibold">{label}</span> akan dihapus permanen.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t);
                resolve(true);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
            >
              Ya, hapus
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  });
}
