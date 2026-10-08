import { guard, json } from "@/lib/api";
import { read, History } from "@/lib/store";
export const GET = guard(async (_r, { params }) => {
  const h = (await read<History[]>("history", [])).find((x) => x.id === params.id);
  return h ? json(h) : json({ error: "Riwayat tidak ditemukan." }, 404);
});
