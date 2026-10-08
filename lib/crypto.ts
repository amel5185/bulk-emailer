import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
const key = () => {
  const k = process.env.ENCRYPTION_KEY || "";
  if (k.length < 16) throw new Error("ENCRYPTION_KEY belum diatur");
  return createHash("sha256").update(k).digest();
};
export function encrypt(text: string) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(s: string) {
  const [iv, tag, enc] = s.split(".").map((x) => Buffer.from(x, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
