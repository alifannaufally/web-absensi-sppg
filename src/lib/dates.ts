export function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function periodeRange(mode: "hari" | "minggu" | "dua-minggu" | "bulan", anchor: string) {
  let end = anchor;
  let start: string;

  switch (mode) {
    case "hari":
      start = end;
      break;
    case "minggu":
      start = addDays(end, -6);
      break;
    case "dua-minggu":
      start = addDays(end, -13);
      break;
    case "bulan":
      start = end.slice(0, 7) + "-01";
      break;
  }

  return {
    start: new Date(start + "T00:00:00.000Z"),
    end: new Date(end + "T23:59:59.999Z"),
  };
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
