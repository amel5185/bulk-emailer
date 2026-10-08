"use client";
import { useCallback, useEffect, useState } from "react";
import { api, I, Account, Config, Hist } from "./ui";
import SendView from "./SendView";
import { AccountsView, ConfigsView, HistoryView, SmtpView } from "./Views";
const NAV = [["send", "paper-plane", "Kirim"], ["configs", "sliders", "Konfigurasi"], ["accounts", "at", "Akun Gmail"], ["smtp", "server", "Cek SMTP"], ["history", "clock-rotate-left", "Riwayat"]] as const;
export default function App() {
  const [view, setView] = useState<string>("send"), [open, setOpen] = useState(false), [dark, setDark] = useState(false);
  const [accounts, setA] = useState<Account[]>([]), [configs, setC] = useState<Config[]>([]), [history, setH] = useState<Hist[]>([]);
  const [loaded, setL] = useState(false), [toasts, setT] = useState<{ id: number; m: string }[]>([]), [online, setOn] = useState(true);
  const toast = useCallback((m: string) => { const id = Date.now() + Math.random(); setT((t) => [...t, { id, m }]); setTimeout(() => setT((t) => t.filter((x) => x.id !== id)), 3500); }, []);
  const reload = useCallback(async () => {
    try { const [a, c, h] = await Promise.all([api("/api/accounts"), api("/api/configs"), api("/api/history")]); setA(a); setC(c); setH(h); setOn(true); }
    catch { setOn(false); toast("Terjadi kesalahan."); }
    setL(true);
  }, [toast]);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); reload(); }, [reload]);
  const theme = () => { const t = dark ? "light" : "dark"; document.documentElement.dataset.theme = t; localStorage.setItem("mc-theme", t); setDark(!dark); };
  const go = (v: string) => { setView(v); setOpen(false); };
  const title = NAV.find((n) => n[0] === view)![2];
  const p = { toast, reload, loaded };
  return (
    <div className="app">
      <div className={"scrim" + (open ? " open" : "")} onClick={() => setOpen(false)} />
      <aside className={"side" + (open ? " open" : "")}>
        <div className="brand"><I n="envelope-circle-check" />Mail Center</div>
        <nav className="nav">{NAV.map(([k, ic, l]) => <button key={k} className={view === k ? "on" : ""} onClick={() => go(k)}><I n={ic} />{l}</button>)}</nav>
        <div className="stat"><span><span className="dot" style={{ background: online ? undefined : "var(--er)" }} />{online ? "Aplikasi aktif" : "Tidak terhubung"}</span><span>Gmail: {accounts.length ? accounts.length + " akun tertaut" : "belum ada akun"}</span></div>
      </aside>
      <div className="main">
        <header className="top"><button className="ib burger" aria-label="Menu" onClick={() => setOpen(true)}><I n="bars" /></button><h2>{title}</h2>
          <button className="ib" aria-label="Ganti tema" onClick={theme}><I n={dark ? "sun" : "moon"} /></button></header>
        <div className="page">
          {view === "send" && <SendView accounts={accounts} configs={configs} {...p} />}
          {view === "configs" && <ConfigsView configs={configs} {...p} />}
          {view === "accounts" && <AccountsView accounts={accounts} {...p} />}
          {view === "smtp" && <SmtpView toast={toast} />}
          {view === "history" && <HistoryView history={history} {...p} />}
        </div>
      </div>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast">{t.m}</div>)}</div>
    </div>
  );
}
