"use client";

import { useState } from "react";
import { I, Modal, Account, Config, Toast } from "./ui";

const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Prog = {
  total: number;
  done: number;
  ok: number;
  fail: number;
  to: string;
  err: string;
  end: boolean;
};

export default function SendView({
  accounts,
  configs,
  toast,
  reload,
}: {
  accounts: Account[];
  configs: Config[];
  toast: Toast;
  reload: () => void;
}) {
  const [acc, setAcc] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loop, setLoop] = useState(false);
  const [count, setCount] = useState(1);
  const [delay, setDelay] = useState(1);

  const [confirm, setConfirm] = useState(false);
  const [prog, setProg] = useState<Prog | null>(null);
  const [busy, setBusy] = useState(false);

  const none = accounts.length === 0;
  const sender = acc || accounts[0]?.id || "";

  const per = loop ? count : 1;
  const total = chips.length * per;

  function add(t: string) {
    const parts = t.split(/[,;\s]+/).filter(Boolean);
    const good: string[] = [];

    for (const p of parts) {
      const e = p.toLowerCase();

      if (!RE.test(e)) {
        toast(`Email tidak valid: ${p}`);
      } else if (!chips.includes(e) && !good.includes(e)) {
        good.push(e);
      }
    }

    if (chips.length + good.length > 10) {
      return toast("Maksimal 10 penerima.");
    }

    setChips([...chips, ...good]);
    setDraft("");
  }

  const useCfg = (id: string) => {
    const c = configs.find((x) => x.id === id);

    if (c) {
      setChips(c.recipients);
      setSubject(c.subject);
      setBody(c.body);
    }
  };

  const ready =
    !none &&
    chips.length > 0 &&
    subject.trim() &&
    body.trim() &&
    total <= 300 &&
    !busy;

  async function start() {
    setConfirm(false);
    setBusy(true);

    toast("Pengiriman dimulai.");

    setProg({
      total,
      done: 0,
      ok: 0,
      fail: 0,
      to: "",
      err: "",
      end: false,
    });

    try {
      const r = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: sender,
          recipients: chips,
          subject,
          body,
          loopEnabled: loop,
          loopCount: count,
          delaySec: delay,
        }),
      });

      if (!r.ok || !r.body) {
        const d = await r.json().catch(() => ({}));

        throw new Error(
          d.error || "Pengiriman gagal."
        );
      }

      const rd = r.body.getReader();
      const dec = new TextDecoder();

      let buf = "";

      for (;;) {
        const { done, value } = await rd.read();

        if (done) break;

        buf += dec.decode(value, {
          stream: true,
        });

        const lines = buf.split("\n");

        buf = lines.pop()!;

        for (const l of lines) {
          if (!l.trim()) continue;

          const e = JSON.parse(l);

          if (e.t === "sending") {
            setProg((p) =>
              p && {
                ...p,
                to: e.to,
              }
            );
          }

          if (e.t === "p") {
            setProg((p) =>
              p && {
                ...p,
                done: e.done,
                ok: e.ok,
                fail: e.fail,
                err: e.error || p.err,
              }
            );
          }

          if (e.t === "end") {
            setProg((p) =>
              p && {
                ...p,
                end: true,
              }
            );
          }
        }
      }

      toast("Pengiriman selesai.");
    } catch (e: any) {
      toast(
        e.message ||
          "Terjadi kesalahan."
      );

      setProg(null);
    }

    setBusy(false);
    reload();
  }

  const pct = prog
    ? Math.round(
        (prog.done /
          Math.max(prog.total, 1)) *
          100
      )
    : 0;

  return (
    <>
      <div className="eb">
        PENGIRIMAN
      </div>

      <h1>Kirim email</h1>

      <p className="sub">
        Kirim pesan dari akun Gmail tertaut ke satu
        atau beberapa penerima.
      </p>

      {none && (
        <div className="card warn">
          <I n="triangle-exclamation" />

          <div>
            <b>Pengiriman belum tersedia</b>
            Tautkan minimal satu akun Gmail terlebih
            dahulu untuk mengaktifkan pengiriman.
          </div>
        </div>
      )}

      <fieldset disabled={none || busy}>
        <div className="card">
          <label style={{ marginTop: 0 }}>
            Gunakan Konfigurasi
          </label>

          <select
            value=""
            onChange={(e) =>
              useCfg(e.target.value)
            }
          >
            <option value="">
              Manual (tanpa konfigurasi)
            </option>

            {configs.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>

          <label>Pengirim</label>

          <select
            value={sender}
            onChange={(e) =>
              setAcc(e.target.value)
            }
          >
            {accounts.map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
                {a.email}
              </option>
            ))}
          </select>

          <label>Penerima</label>

          <div className="chips">
            {chips.map((c) => (
              <span
                key={c}
                className="chip"
              >
                {c}

                <i
                  className="fa-solid fa-xmark"
                  onClick={() =>
                    setChips(
                      chips.filter(
                        (x) => x !== c
                      )
                    )
                  }
                />
              </span>
            ))}

            <input
              value={draft}
              placeholder="email1@contoh.com email2@contoh.com"
              onChange={(e) =>
                /[,;\s]$/.test(
                  e.target.value
                )
                  ? add(e.target.value)
                  : setDraft(
                      e.target.value
                    )
              }
              onBlur={() =>
                draft && add(draft)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  e.preventDefault();
                  add(draft);
                }
              }}
            />
          </div>

          <label>Subject</label>

          <input
            value={subject}
            maxLength={200}
            onChange={(e) =>
              setSubject(e.target.value)
            }
          />

          <label>Pesan</label>

          <textarea
            value={body}
            maxLength={5000}
            onChange={(e) =>
              setBody(e.target.value)
            }
          />
        </div>

        <div className="card">
          <div className="row">
            <div>
              <b>
                Pengiriman berulang
              </b>

              <div
                className="sub"
                style={{ margin: 0 }}
              >
                Ulangi pesan yang sama untuk
                setiap penerima.
              </div>
            </div>

            <label
              className="sw"
              style={{ margin: 0 }}
            >
              <input
                type="checkbox"
                checked={loop}
                aria-label="Loop aktif"
                onChange={(e) => {
                  setLoop(
                    e.target.checked
                  );
                  setCount(1);
                }}
              />

              <span />
            </label>
          </div>

          {loop && (
            <div className="g2">
              <div>
                <label>
                  Jumlah pengiriman
                </label>

                <input
                  type="number"
                  min={1}
                  max={300}
                  value={count}
                  onChange={(e) =>
                    setCount(
                      Math.min(
                        300,
                        Math.max(
                          1,
                          Math.floor(
                            +e.target.value
                          ) || 1
                        )
                      )
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Jeda antar pengiriman
                  (detik)
                </label>

                <input
                  type="number"
                  min={1}
                  max={10}
                  value={delay}
                  onChange={(e) =>
                    setDelay(
                      Math.min(
                        10,
                        Math.max(
                          1,
                          +e.target.value ||
                            1
                        )
                      )
                    )
                  }
                />
              </div>
            </div>
          )}

          {!loop && (
            <div>
              <label>
                Jeda antar pengiriman
                (detik)
              </label>

              <input
                type="number"
                min={1}
                max={10}
                value={delay}
                onChange={(e) =>
                  setDelay(
                    Math.min(
                      10,
                      Math.max(
                        1,
                        +e.target.value ||
                          1
                      )
                    )
                  )
                }
              />
            </div>
          )}

          <div
            className="sum"
            style={{ marginTop: 16 }}
          >
            <div>
              Penerima
              <b>{chips.length}</b>
            </div>

            <div>
              Pengiriman per penerima
              <b>{per}</b>
            </div>

            <div>
              Total email
              <b>{total}</b>
            </div>
          </div>
        </div>

        <button
          className="btn"
          style={{ width: "100%" }}
          disabled={!ready}
          onClick={() =>
            setConfirm(true)
          }
        >
          <I n="paper-plane" />
          Kirim
        </button>
      </fieldset>

      {prog && (
        <div
          className="card"
          style={{ marginTop: 16 }}
        >
          <b>
            {prog.end
              ? "Pengiriman selesai"
              : "Pengiriman berjalan"}
          </b>

          <div className="bar">
            <i
              style={{
                width: pct + "%",
              }}
            />
          </div>

          <div className="sum">
            <div>
              Progres
              <b>
                {prog.done} /{" "}
                {prog.total} ({pct}%)
              </b>
            </div>

            <div>
              Berhasil
              <b>{prog.ok}</b>
            </div>

            <div>
              Gagal
              <b>{prog.fail}</b>
            </div>
          </div>

          {!prog.end &&
            prog.to && (
              <p
                className="sub"
                style={{
                  marginTop: 12,
                }}
              >
                Status: Mengirim ke{" "}
                {prog.to}
              </p>
            )}

          {prog.err && (
            <div className="err">
              {prog.err}
            </div>
          )}
        </div>
      )}

      {confirm && (
        <Modal
          title="Konfirmasi pengiriman"
          onClose={() =>
            setConfirm(false)
          }
          foot={
            <>
              <button
                className="btn g"
                onClick={() =>
                  setConfirm(false)
                }
              >
                Batal
              </button>

              <button
                className="btn"
                onClick={start}
              >
                Mulai Pengiriman
              </button>
            </>
          }
        >
          <div className="kv">
            <span>Pengirim</span>
            <span>
              {
                accounts.find(
                  (a) =>
                    a.id === sender
                )?.email
              }
            </span>

            <span>Penerima</span>
            <span>{chips.length}</span>

            <span>
              Per penerima
            </span>
            <span>{per}</span>

            <span>Total email</span>
            <span>{total}</span>

            <span>Subject</span>
            <span>{subject}</span>
          </div>
        </Modal>
      )}
    </>
  );
}