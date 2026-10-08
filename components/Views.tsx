"use client";
import { useState } from "react";
import { api, I, Modal, Empty, fmt, statusLabel, Account, Config, Hist, Toast } from "./ui";
const Skel = () => <><div className="skel" /><div className="skel" /></>;
type P = { toast: Toast; reload: () => void; loaded: boolean };
export function AccountsView({ accounts, toast, reload, loaded }: P & { accounts: Account[] }) {
  const [add, setAdd] = useState(false), [del, setDel] = useState<Account | null>(null), [f, setF] = useState({ email: "", displayName: "", appPassword: "" }), [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await api("/api/accounts", { method: "POST", body: JSON.stringify(f) }); toast("Akun berhasil ditambahkan."); setAdd(false); setF({ email: "", displayName: "", appPassword: "" }); reload(); }
    catch (e: any) { toast(e.message); }
    setBusy(false);
  }
  async function remove() { try { await api("/api/accounts/" + del!.id, { method: "DELETE" }); toast("Akun dihapus."); setDel(null); reload(); } catch (e: any) { toast(e.message); } }
  return (<>
    <div className="row"><div><div className="eb">AKUN</div><h1>Akun Gmail</h1></div><button className="btn" onClick={() => setAdd(true)}><I n="plus" />Tambah Akun Gmail</button></div>
    <p className="sub">Akun yang dapat dipakai untuk mengirim email. App Password tersimpan terenkripsi di server.</p>
    <div className="card">{!loaded ? <Skel /> : accounts.length === 0 ? <Empty icon="at" title="Belum ada akun Gmail" text="Tambahkan akun Gmail untuk mulai menggunakan pengiriman." /> :
      accounts.map((a) => <div className="item" key={a.id}><div><b>{a.email}</b><small>{a.displayName || "Tanpa nama tampilan"} · ditambahkan {fmt(a.createdAt)}</small></div><button className="btn g" aria-label="Hapus" onClick={() => setDel(a)}><I n="trash" /></button></div>)}</div>
    {add && <Modal title="Tambah Akun Gmail" onClose={() => setAdd(false)} foot={<><button className="btn g" onClick={() => setAdd(false)}>Batal</button><button className="btn" disabled={busy} onClick={save}>{busy && <I n="spinner fa-spin" />}Simpan</button></>}>
      <label>Alamat Gmail</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <label>Nama tampilan (opsional)</label><input value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} />
      <label>App Password (16 karakter)</label><input type="password" autoComplete="off" value={f.appPassword} onChange={(e) => setF({ ...f, appPassword: e.target.value })} />
      <p className="sub" style={{ fontSize: 12, marginTop: 8 }}>Buat di Akun Google &gt; Keamanan &gt; Verifikasi 2 Langkah &gt; Sandi aplikasi.</p>
    </Modal>}
    {del && <Modal title="Hapus akun?" onClose={() => setDel(null)} foot={<><button className="btn g" onClick={() => setDel(null)}>Batal</button><button className="btn d" onClick={remove}>Hapus</button></>}><p>{del.email} akan dihapus beserta kredensialnya.</p></Modal>}
  </>);
}
type SmtpResult = {
  email: string; ok: boolean; linked: boolean; provider: string; host: string; port: number; secure: boolean; message: string;
};

export function SmtpView({ toast }: { toast: Toast }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SmtpResult | null>(null);

  async function check() {
    if (!email.trim()) return toast("Masukkan alamat Gmail terlebih dahulu.");
    setBusy(true);
    setResult(null);
    try {
      const r = await api("/api/smtp-check", { method: "POST", body: JSON.stringify({ email }) });
      setResult(r);
    } catch (e: any) {
      toast(e.message);
    }
    setBusy(false);
  }

  return (<>
    <div className="eb">DIAGNOSTIK</div><h1>Cek SMTP Gmail</h1>
    <p className="sub">Masukkan alamat Gmail untuk melihat konfigurasi SMTP dan menguji koneksi jika akun sudah tertaut.</p>
    <div className="card">
      <label style={{ marginTop: 0 }}>Alamat Gmail</label>
      <div className="smtp-form">
        <input type="email" value={email} placeholder="nama@gmail.com" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") check(); }} />
        <button className="btn" disabled={busy || !email.trim()} onClick={check}>{busy ? <I n="spinner fa-spin" /> : <I n="server" />}Cek SMTP</button>
      </div>
    </div>
    {result && <div className={"card smtp-result " + (result.ok ? "smtp-ok" : "smtp-bad")}>
      <div className="row"><div><div className="eb">HASIL</div><h3 style={{ margin: "5px 0" }}>{result.ok ? "SMTP Aktif" : "SMTP Belum Terverifikasi"}</h3></div><span className={"badge " + (result.ok ? "b-success" : "b-failed")}>{result.ok ? "BERHASIL" : "CEK LAGI"}</span></div>
      <p>{result.message}</p>
      <div className="kv"><span>Email</span><span>{result.email}</span><span>Provider</span><span>{result.provider}</span><span>SMTP Host</span><span>{result.host}</span><span>Port</span><span>{result.port}</span><span>Secure</span><span>{result.secure ? "Ya (SSL/TLS)" : "Tidak"}</span><span>Akun tertaut</span><span>{result.linked ? "Ya" : "Belum"}</span></div>
    </div>}
  </>);
}

const empty = { name: "", recipients: "", subject: "", body: "" };
export function ConfigsView({ configs, toast, reload, loaded }: P & { configs: Config[] }) {
  const [edit, setEdit] = useState<string | null>(null), [f, setF] = useState(empty), [del, setDel] = useState<Config | null>(null), [busy, setBusy] = useState(false);
  const openNew = () => { setF(empty); setEdit("new"); };
  const openEdit = (c: Config) => { setF({ name: c.name, recipients: c.recipients.join(" "), subject: c.subject, body: c.body }); setEdit(c.id); };
  async function save() {
    setBusy(true);
    try {
      const body = JSON.stringify({ ...f, recipients: f.recipients.split(/[,;\s]+/).filter(Boolean) });
      await api(edit === "new" ? "/api/configs" : "/api/configs/" + edit, { method: edit === "new" ? "POST" : "PUT", body });
      toast("Konfigurasi berhasil disimpan."); setEdit(null); reload();
    } catch (e: any) { toast(e.message); }
    setBusy(false);
  }
  async function remove() { try { await api("/api/configs/" + del!.id, { method: "DELETE" }); toast("Konfigurasi dihapus."); setDel(null); reload(); } catch (e: any) { toast(e.message); } }
  return (<>
    <div className="row"><div><div className="eb">TEMPLATE</div><h1>Konfigurasi</h1></div><button className="btn" onClick={openNew}><I n="plus" />Tambah Konfigurasi</button></div>
    <p className="sub">Simpan penerima, subject, dan isi pesan. Pilih dari halaman Kirim. Loop diatur saat mengirim.</p>
    <div className="card">{!loaded ? <Skel /> : configs.length === 0 ? <Empty icon="sliders" title="Belum ada konfigurasi" text="Buat konfigurasi untuk mempercepat pengiriman berulang." /> :
      configs.map((c) => <div className="item" key={c.id}><div><b>{c.name}</b><small>{c.subject || "(tanpa subject)"} · {c.recipients.length} penerima</small></div>
        <div style={{ display: "flex", gap: 8 }}><button className="btn g" aria-label="Edit" onClick={() => openEdit(c)}><I n="pen" /></button><button className="btn g" aria-label="Hapus" onClick={() => setDel(c)}><I n="trash" /></button></div></div>)}</div>
    {edit && <Modal title={edit === "new" ? "Tambah Konfigurasi" : "Edit Konfigurasi"} onClose={() => setEdit(null)} foot={<><button className="btn g" onClick={() => setEdit(null)}>Batal</button><button className="btn" disabled={busy || !f.name.trim()} onClick={save}>Simpan</button></>}>
      <label>Nama konfigurasi</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <label>Penerima (pisahkan dengan spasi)</label><input value={f.recipients} onChange={(e) => setF({ ...f, recipients: e.target.value })} />
      <label>Subject</label><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
      <label>Isi pesan</label><textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
    </Modal>}
    {del && <Modal title="Hapus konfigurasi?" onClose={() => setDel(null)} foot={<><button className="btn g" onClick={() => setDel(null)}>Batal</button><button className="btn d" onClick={remove}>Hapus</button></>}><p>&quot;{del.name}&quot; akan dihapus permanen.</p></Modal>}
  </>);
}
export function HistoryView({ history, loaded }: P & { history: Hist[] }) {
  const [sel, setSel] = useState<Hist | null>(null);
  return (<>
    <div className="eb">AKTIVITAS</div><h1>Riwayat</h1><p className="sub">Catatan semua proses pengiriman.</p>
    <div className="card">{!loaded ? <Skel /> : history.length === 0 ? <Empty icon="clock-rotate-left" title="Belum ada riwayat" text="Riwayat akan muncul setelah Anda mengirim email." /> :
      history.map((h) => <div className="item click" key={h.id} onClick={() => setSel(h)}><div><b>{h.subject}</b><small>{fmt(h.createdAt)} · {h.accountEmail} → {h.recipients.length} penerima</small><small>Total {h.totalAttempts} · Berhasil {h.successCount} · Gagal {h.failedCount}</small></div><span className={"badge b-" + h.status}>{statusLabel[h.status]}</span></div>)}</div>
    {sel && <Modal title="Detail pengiriman" onClose={() => setSel(null)} foot={<button className="btn g" onClick={() => setSel(null)}>Tutup</button>}>
      <div className="kv"><span>Tanggal</span><span>{fmt(sel.createdAt)}</span><span>Pengirim</span><span>{sel.accountEmail}</span><span>Penerima</span><span>{sel.recipients.join(", ")}</span><span>Subject</span><span>{sel.subject}</span>
        <span>Loop</span><span>{sel.loopEnabled ? "Aktif" : "Tidak aktif"}</span><span>Per penerima</span><span>{sel.loopCount}</span><span>Total</span><span>{sel.totalAttempts}</span><span>Berhasil</span><span>{sel.successCount}</span><span>Gagal</span><span>{sel.failedCount}</span><span>Status</span><span>{statusLabel[sel.status]}</span></div>
      {sel.errors.length > 0 && <div className="err">{sel.errors.map((e, i) => <div key={i}>{e.to}: {e.msg}</div>)}</div>}
    </Modal>}
  </>);
}
