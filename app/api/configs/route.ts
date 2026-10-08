import { z } from "zod";
import { guard, json } from "@/lib/api";
import { read, write, Config } from "@/lib/store";
export const configSchema = z.object({
  name: z.string().trim().min(1).max(80),
  recipients: z.array(z.string().trim().toLowerCase().email()).max(10),
  subject: z.string().trim().max(200).transform((s) => s.replace(/[\r\n]+/g, " ")),
  body: z.string().max(5000),
});
export const GET = guard(async () => json(await read<Config[]>("configs", [])));
export const POST = guard(async (req) => {
  const d = configSchema.parse(await req.json());
  const all = await read<Config[]>("configs", []);
  if (all.length >= 50) return json({ error: "Maksimal 50 konfigurasi." }, 400);
  const now = new Date().toISOString();
  const c: Config = { ...d, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  await write("configs", [...all, c]);
  return json(c, 201);
});
