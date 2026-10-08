import { getSupabase } from "./supabase";

export const usingSupabase = true;

export type Account = {
  id: string;
  email: string;
  displayName: string;
  cred: string;
  createdAt: string;
  updatedAt: string;
};

export type Config = {
  id: string;
  name: string;
  recipients: string[];
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type History = {
  id: string;
  accountId: string;
  accountEmail: string;
  recipients: string[];
  subject: string;
  loopEnabled: boolean;
  loopCount: number;
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  status: "running" | "success" | "partial" | "failed";
  errors: { to: string; msg: string }[];
  createdAt: string;
};

const TABLES = {
  accounts: "accounts",
  configs: "configs",
  history: "history",
} as const;

type StoreKey = keyof typeof TABLES;

async function getRows<T>(key: StoreKey): Promise<T[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(TABLES[key])
    .select("data")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Supabase read ${TABLES[key]} failed: ${error.message}`
    );
  }

  return (data ?? []).map((row) => row.data as T);
}

export async function read<T>(key: string, def: T): Promise<T> {
  if (!(key in TABLES)) return def;

  const rows = await getRows<T>(key as StoreKey);

  if (Array.isArray(def)) {
    return rows as T;
  }

  return (rows[0] ?? def) as T;
}

export async function write(
  key: string,
  value: unknown,
  _ttl?: number
) {
  if (!(key in TABLES)) {
    throw new Error(`Unknown store key: ${key}`);
  }

  const supabase = getSupabase();
  const table = TABLES[key as StoreKey];

  if (!Array.isArray(value)) {
    const { error } = await supabase
      .from(table)
      .upsert({
        id: "default",
        data: value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(
        `Supabase write ${table} failed: ${error.message}`
      );
    }

    return;
  }

  const now = new Date().toISOString();

  const rows = value.map((item: any) => ({
    id: String(item.id),
    data: item,
    created_at: item.createdAt ?? now,
    updated_at: item.updatedAt ?? now,
  }));

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .neq("id", "");

  if (deleteError) {
    throw new Error(
      `Supabase clear ${table} failed: ${deleteError.message}`
    );
  }

  if (rows.length === 0) return;

  const { error: insertError } = await supabase
    .from(table)
    .insert(rows);

  if (insertError) {
    throw new Error(
      `Supabase write ${table} failed: ${insertError.message}`
    );
  }
}

export async function patchHistory(
  id: string,
  patch: Partial<History>
) {
  const supabase = getSupabase();

  const { data: row, error: readError } = await supabase
    .from("history")
    .select("data")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `Supabase history read failed: ${readError.message}`
    );
  }

  if (!row) return;

  const updated = {
    ...(row.data as History),
    ...patch,
  };

  const { error } = await supabase
    .from("history")
    .update({
      data: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Supabase history update failed: ${error.message}`
    );
  }
}