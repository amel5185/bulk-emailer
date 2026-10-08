import { z } from "zod";
import { json } from "@/lib/api";
import { limit } from "@/lib/ratelimit";
import { read, write, patchHistory, Account, History } from "@/lib/store";
import { decrypt } from "@/lib/crypto";
import { transport, mapError } from "@/lib/mailer";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
const schema = z.object({
  accountId: z.string().min(1),
  recipients: z.array(z.string().trim().toLowerCase().email()).min(1).max(10),
  subject: z.string().trim().min(1).max(200).transform((s) => s.replace(/[\r\n]+/g, " ")),
  body: z.string().trim().min(1).max(5000),
  loopEnabled: z.boolean(),
  loopCount: z.number().int().min(1).max(300),
  delaySec: z.number().min(1).max(1),
});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function POST(req: Request) {
  if (!(await limit("send", 5, 600))) return json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, 429);
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "Input tidak valid. Periksa penerima, subject, pesan, dan loop (maks 300)." }, 400);
  const d = p.data;
  const rec = [...new Set(d.recipients)];
  const per = d.loopEnabled ? d.loopCount : 1; // backend memaksa 1 jika loop OFF, maks 2 jika ON
  const total = rec.length * per;
  if (total > 300) return json({ error: "Maksimal 300 email per proses." }, 400);
  const acc = (await read<Account[]>("accounts", [])).find((a) => a.id === d.accountId);
  if (!acc) return json({ error: "Akun Gmail tidak ditemukan." }, 400);
  const id = crypto.randomUUID();
  const h: History = { id, accountId: acc.id, accountEmail: acc.email, recipients: rec, subject: d.subject, loopEnabled: d.loopEnabled, loopCount: per, totalAttempts: total, successCount: 0, failedCount: 0, status: "running", errors: [], createdAt: new Date().toISOString() };
  await write("history", [...(await read<History[]>("history", [])), h].slice(-200));
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      const w = (o: object) => c.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      let ok = 0, fail = 0, n = 0;
      const errors: History["errors"] = [];
      w({ t: "start", total });
      try {
        const tr = transport(acc.email, decrypt(acc.cred));
        for (const to of rec) for (let i = 0; i < per; i++) {
          if (n > 0) await sleep(d.delaySec * 1000);
          w({ t: "sending", to, done: n });
          try {
            await tr.sendMail({ from: acc.displayName ? `"${acc.displayName.replace(/"/g, "")}" <${acc.email}>` : acc.email, to, subject: d.subject, text: d.body });
            ok++;
          } catch (e) {
            fail++;
            console.error("send error", e);
            errors.push({ to, msg: mapError(e) });
          }
          n++;
          w({ t: "p", done: n, ok, fail, to, error: errors.length ? errors[errors.length - 1].msg : undefined });
        }
      } catch (e) { console.error(e); fail = total - ok; errors.push({ to: "-", msg: "Pengiriman gagal. Periksa koneksi akun Gmail." }); }
      const status = fail === 0 ? "success" : ok === 0 ? "failed" : "partial";
      await patchHistory(id, { successCount: ok, failedCount: fail, status, errors });
      w({ t: "end", ok, fail, status });
      c.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
