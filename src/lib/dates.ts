export function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function periodeRange(mode: "hari" | "minggu" | "dua-minggu" | "bulan", anchor: Date) {
  const end = new Date(anchor);
  end.setHours(0, 0, 0, 0);

  let start: Date;

  switch (mode) {
    case "hari":
      start = new Date(end);
      break;
    case "minggu":
      start = addDays(end, -6);
      break;
    case "dua-minggu":
      start = addDays(end, -13);
      break;
    case "bulan":
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(d: Date) {
  return d.toISOString().slice(0, 10);
}
