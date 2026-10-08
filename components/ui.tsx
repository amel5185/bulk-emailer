"use client";
import { ReactNode } from "react";
export async function api(p: string, o: RequestInit = {}) {
  const r = await fetch(p, { ...o, headers: { "Content-Type": "application/json" } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Terjadi kesalahan.");
  return d;
}
export const I = ({ n }: { n: string }) => <i className={"fa-solid fa-" + n} aria-hidden />;
export const fmt = (s: string) => new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
export const statusLabel: Record<string, string> = { success: "Berhasil", partial: "Sebagian berhasil", failed: "Gagal", running: "Berjalan" };
export function Modal({ title, onClose, children, foot }: { title: string; onClose: () => void; children?: ReactNode; foot?: ReactNode }) {
  return <div className="ov" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><h3>{title}</h3>{children}<div className="foot">{foot}</div></div></div>;
}
export const Empty = ({ icon, title, text, action }: { icon: string; title: string; text: string; action?: ReactNode }) =>
  <div className="empty"><div><I n={icon} /></div><h3>{title}</h3><p>{text}</p>{action}</div>;
export type Account = { id: string; email: string; displayName: string; createdAt: string };
export type Config = { id: string; name: string; recipients: string[]; subject: string; body: string };
export type Hist = { id: string; accountEmail: string; recipients: string[]; subject: string; loopEnabled: boolean; loopCount: number; totalAttempts: number; successCount: number; failedCount: number; status: string; errors: { to: string; msg: string }[]; createdAt: string };
export type Toast = (m: string) => void;
