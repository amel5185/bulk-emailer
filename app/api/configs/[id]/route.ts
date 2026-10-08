import { guard, json } from "@/lib/api";
import { read, write, Config } from "@/lib/store";
import { configSchema } from "../route";
export const PUT = guard(async (req, { params }) => {
  const d = configSchema.parse(await req.json());
  const all = await read<Config[]>("configs", []);
  if (!all.some((c) => c.id === params.id)) return json({ error: "Konfigurasi tidak ditemukan." }, 404);
  const now = new Date().toISOString();
  await write("configs", all.map((c) => (c.id === params.id ? { ...c, ...d, updatedAt: now } : c)));
  return json({ ok: true });
});
export const DELETE = guard(async (_r, { params }) => {
  const all = await read<Config[]>("configs", []);
  await write("configs", all.filter((c) => c.id !== params.id));
  return json({ ok: true });
});
