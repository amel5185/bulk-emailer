import { z } from "zod";
import { json } from "@/lib/api";
import { read, Account } from "@/lib/store";
import { decrypt } from "@/lib/crypto";
import { transport, mapError } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Alamat email tidak valid." }, 400);

  const email = parsed.data.email;
  const isGmail = /@(gmail|googlemail)\.com$/i.test(email);
  if (!isGmail) {
    return json({
      email,
      ok: false,
      linked: false,
      provider: "Bukan Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      message: "Menu ini khusus pengecekan SMTP Gmail.",
    });
  }

  const account = (await read<Account[]>("accounts", [])).find((a) => a.email.toLowerCase() === email);
  if (!account) {
    return json({
      email,
      ok: false,
      linked: false,
      provider: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      message: "Email Gmail valid, tetapi akun ini belum ditautkan di menu Akun Gmail sehingga autentikasi SMTP belum bisa diuji.",
    });
  }

  try {
    await transport(account.email, decrypt(account.cred)).verify();
    return json({
      email,
      ok: true,
      linked: true,
      provider: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      message: "SMTP Gmail terhubung dan autentikasi berhasil.",
    });
  } catch (e) {
    return json({
      email,
      ok: false,
      linked: true,
      provider: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      message: mapError(e),
    });
  }
}
