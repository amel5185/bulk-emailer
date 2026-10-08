import { guard, json } from "@/lib/api";
import { read, History } from "@/lib/store";
export const GET = guard(async () => json((await read<History[]>("history", [])).slice().reverse()));
