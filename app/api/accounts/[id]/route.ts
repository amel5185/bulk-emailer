import { guard, json } from "@/lib/api";
import { read, write, Account } from "@/lib/store";
export const DELETE = guard(async (_r, { params }) => {
  const all = await read<Account[]>("accounts", []);
  await write("accounts", all.filter((a) => a.id !== params.id));
  return json({ ok: true });
});
