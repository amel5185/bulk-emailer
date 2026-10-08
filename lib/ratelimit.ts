import { getSupabase } from "./supabase";

export async function limit(
  key: string,
  max: number,
  windowSec: number
) {
  const supabase = getSupabase();

  const now = Date.now();
  const cutoff = now - windowSec * 1000;

  const { data: row, error: readError } = await supabase
    .from("rate_limits")
    .select("timestamps")
    .eq("key", key)
    .maybeSingle();

  if (readError) {
    console.error("Rate limit read error:", readError);
    return false;
  }

  const timestamps = Array.isArray(row?.timestamps)
    ? row.timestamps.filter(
        (t: unknown) =>
          typeof t === "number" && t > cutoff
      )
    : [];

  if (timestamps.length >= max) {
    return false;
  }

  timestamps.push(now);

  const { error: writeError } = await supabase
    .from("rate_limits")
    .upsert(
      {
        key,
        timestamps,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    );

  if (writeError) {
    console.error("Rate limit write error:", writeError);
    return false;
  }

  return true;
}