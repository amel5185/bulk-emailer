import nodemailer from "nodemailer";
export const transport = (user: string, pass: string) =>
  nodemailer.createTransport({ service: "gmail", auth: { user, pass }, connectionTimeout: 10000, socketTimeout: 20000 });
export function mapError(e: any) {
  const c = e?.responseCode, code = e?.code;
  if (code === "EAUTH" || c === 535) return "Autentikasi Gmail gagal. Periksa App Password.";
  if (["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(code)) return "Koneksi ke Gmail timeout.";
  if ([501, 550, 553].includes(c)) return "Alamat penerima ditolak.";
  if ([421, 450, 452, 454].includes(c)) return "Batas Gmail tercapai. Coba lagi nanti.";
  return "Pengiriman gagal. Periksa koneksi akun Gmail.";
}
