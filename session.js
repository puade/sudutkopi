/* ==========================
   Outletmu - session.js
   Sesi meja + jam buka + rincian pajak/layanan (sisi pelanggan).
   Dimuat SEBELUM app.js. Rumus jam buka & masa hidup sesi harus sama
   dengan yang ada di firestore.rules (fungsi openNow & sessionLive).

   Alur:
   - Scan QR (?meja=ID) pada meja kosong  -> membuka sesi baru (menulis sessionId ke tables/ID)
   - Scan QR pada meja yang sesinya hidup -> ikut sesi itu (satu meja, banyak ponsel)
   - Sesi habis / dikosongkan admin / kedai tutup -> mode lihat-saja (tidak bisa memesan)
   ========================== */

const Session = (() => {
  const hasDb = typeof db !== "undefined";
  const KEY = "outletmu_sess"; // { [tableId]: sessionId }
  const GUEST_MS = 15 * 60 * 1000; // jendela tamu: sama dengan rules (15 menit)
  const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  let cfg = {};
  let table = null;
  let tablesConfigured = false;
  let sid = "";
  let mode = "demo"; // demo | noTable | ok | closed | ended
  let attempted = false;
  let openErr = ""; // kode galat bila sesi gagal dibuka (untuk diagnosis)
  let lastSig = "";
  const listeners = [];

  const pad = (n) => String(n).padStart(2, "0");
  const hm = (m) => pad(Math.floor(m / 60)) + "." + pad(m % 60);
  const toMs = (v) => (v && v.toMillis ? v.toMillis() : typeof v === "number" ? v : 0);
  const SV = () => firebase.firestore.FieldValue.serverTimestamp();
  const readMap = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const saveSid = (tid, v) => { try { const m = readMap(); m[tid] = v; localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { /* diabaikan */ } };
  const rid = (bytes = 12) => {
    const a = new Uint8Array(bytes);
    crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  /* ---------- Jam buka ---------- */
  function localTime(now) {
    const t = now + (typeof cfg.tzOffset === "number" ? cfg.tzOffset : 420) * 60000;
    return { wd: (Math.floor(t / 86400000) + 4) % 7, mins: (t % 86400000) / 60000 };
  }
  const hasSchedule = () => Array.isArray(cfg.schedule) && cfg.schedule.length === 7;

  function shopOpen(now) {
    if (cfg.acceptOrders === false) return { open: false, why: "manual" };
    if (!hasSchedule()) return { open: true };
    const { wd, mins } = localTime(now);
    const d = cfg.schedule[wd];
    if (d && d.open === true && mins >= d.from && mins < d.to) return { open: true };
    return { open: false, why: "hours" };
  }

  function nextOpenText(now) {
    if (!hasSchedule()) return "";
    const { wd, mins } = localTime(now);
    const today = cfg.schedule[wd];
    if (today && today.open && mins < today.from) return `Buka hari ini pukul ${hm(today.from)}.`;
    for (let i = 1; i <= 7; i++) {
      const d = cfg.schedule[(wd + i) % 7];
      if (d && d.open) return `Buka lagi ${i === 1 ? "besok" : DAYS[(wd + i) % 7]} pukul ${hm(d.from)}.`;
    }
    return "";
  }

  function hoursText() {
    if (!hasSchedule()) return "";
    const d = cfg.schedule[localTime(Date.now()).wd];
    return d && d.open ? `${hm(d.from)} - ${hm(d.to)}` : "Tutup hari ini";
  }

  /* ---------- Sesi ---------- */
  function tableLive(t, now) {
    if (!t || !t.sessionId) return false;
    const opened = toMs(t.sessionOpenedAt), until = toMs(t.sessionUntil);
    return (opened > 0 && now < opened + GUEST_MS) || (until > 0 && now < until);
  }

  function evaluate() {
    const now = Date.now();
    if (!hasDb || !tablesConfigured) mode = "demo";
    else if (!table) mode = "noTable";
    else {
      const open = shopOpen(now).open;
      const live = tableLive(table, now);
      if (live) {
        if (sid !== table.sessionId) { sid = table.sessionId; saveSid(table.id, sid); } // ikut sesi meja ini
        mode = open ? "ok" : "closed";
      } else {
        mode = open ? "ended" : "closed";
      }
    }
    const sig = [mode, sid, openErr, hoursText(), cfg.serviceRate, cfg.taxRate, cfg.acceptOrders].join("|");
    if (sig !== lastSig) { lastSig = sig; listeners.forEach((fn) => { try { fn(mode); } catch (e) { console.error(e); } }); }
  }

  async function openSession() {
    attempted = true;
    const id = "s" + rid(12);
    try {
      await db.collection("tables").doc(table.id).update({ sessionId: id, sessionOpenedAt: SV() });
      sid = id;
      saveSid(table.id, id);
    } catch (e) {
      // gagal (mis. ponsel lain sudah membuka sesi lebih dulu): ikut sesi yang ada lewat snapshot
      openErr = e.code || e.message || "unknown";
      console.warn("Sesi tidak dibuka:", openErr);
    }
  }

  async function start(c, t, hasTables) {
    cfg = c || {};
    table = t || null;
    tablesConfigured = !!hasTables;
    sid = table ? readMap()[table.id] || "" : "";
    evaluate();
    if (!hasDb || !table) return;

    if (mode === "ended" && !attempted) { await openSession(); }
    // dengarkan perubahan: admin menekan Kosongkan meja / memperpanjang sesi / menutup kedai
    db.collection("tables").doc(table.id).onSnapshot((snap) => {
      if (snap.exists) { table = { id: snap.id, ...snap.data({ serverTimestamps: "estimate" }) }; evaluate(); }
    }, () => {});
    db.doc("settings/outlet").onSnapshot((snap) => {
      if (snap.exists) { cfg = snap.data(); evaluate(); }
    }, () => {});
    setInterval(evaluate, 20000); // sesi/jam buka berubah seiring waktu
    evaluate();
  }

  /* ---------- Teks status ---------- */
  function blockText() {
    if (mode === "ok" || mode === "demo") return "";
    if (mode === "noTable") return "Scan QR di mejamu untuk memesan.";
    if (mode === "closed") {
      const s = shopOpen(Date.now());
      return s.why === "manual"
        ? "Kedai sedang tidak menerima pesanan."
        : ("Kedai sedang tutup. " + nextOpenText(Date.now())).trim();
    }
    if (openErr && !(table && tableLive(table, Date.now()))) {
      return `Sesi meja tidak bisa dibuka (kode: ${openErr}). Scan ulang QR di mejamu, atau minta bantuan kasir.`;
    }
    return "Sesi meja ini sudah berakhir. Scan ulang QR di mejamu untuk memesan.";
  }

  /* ---------- Pembayaran ---------- */
  function payConf() {
    const hasQris = !!cfg.qrisUrl, hasAcc = !!cfg.accNo;
    return {
      mode: cfg.payMode === "awal" ? "awal" : cfg.payMode === "akhir" ? "akhir" : "off", // awal | akhir | off
      transfer: cfg.payTransfer !== false && (hasQris || hasAcc),
      cash: cfg.payCash !== false,
      qrisUrl: cfg.qrisUrl || "", bankName: cfg.bankName || "", accNo: cfg.accNo || "", accName: cfg.accName || ""
    };
  }

  /* ---------- Pajak & layanan (harga menu SUDAH termasuk) ---------- */
  function fee(total) {
    const s = Number(cfg.serviceRate) || 0, t = Number(cfg.taxRate) || 0;
    if (!s && !t) return null;
    const base0 = total / ((1 + s / 100) * (1 + t / 100));
    const service = Math.round(base0 * (s / 100));
    const tax = Math.round((base0 + service) * (t / 100));
    return { sRate: s, tRate: t, service, tax, base: total - service - tax };
  }

  /* true bila sesi berganti sejak terakhir kali pemanggil memeriksa (untuk membersihkan data pelanggan lama) */
  function changedSince(storeKey) {
    if (!sid) return false;
    let prev = "";
    try { prev = localStorage.getItem(storeKey) || ""; localStorage.setItem(storeKey, sid); } catch (e) { /* diabaikan */ }
    return prev !== sid;
  }

  return {
    start,
    onChange: (fn) => listeners.push(fn),
    mode: () => mode,
    canOrder: () => mode === "ok" || mode === "demo",
    canChat: () => mode === "ok" || mode === "closed",
    sid: () => sid,
    tableId: () => (table ? table.id : ""),
    holdsTable: () => !!(table && sid && table.sessionId === sid), // meja masih memegang sesi perangkat ini (belum dikosongkan)
    blockText,
    hoursText,
    cfg: () => cfg,
    payConf,
    fee,
    changedSince
  };
})();
