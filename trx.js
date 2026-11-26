/* ==========================
   Outletmu - trx.js
   Navigasi bawah: Transaksi | Chat | Pindah Meja | Riwayat
   - Transaksi : pesanan & status pembayaran pada sesi meja ini
   - Pindah Meja: hanya aktif bila SEMUA pesanan sesi ini sudah dibayar (lunas)
   - Riwayat   : semua pesanan yang pernah dibuat di perangkat ini
   Dimuat setelah bill.js.
   ========================== */

const Trx = (() => {
  const KEY = "outletmu_trx";
  const MAX_N = 50, MAX_AGE = 60 * 24 * 3600 * 1000;
  const SKIP = ["dibatalkan", "gagal", "kedaluwarsa"];
  const MOVABLE = ["baru", "diproses", "siap"]; // pesanan yang belum selesai ikut pindah meja
  const hasDb = typeof db !== "undefined";
  const LABEL = {
    menunggu_bayar: "Menunggu pembayaran", verifikasi: "Verifikasi bukti", baru: "Pesanan diterima", diproses: "Sedang diproses",
    siap: "Sedang diantar", selesai: "Selesai", dibatalkan: "Dibatalkan", gagal: "Gagal", kedaluwarsa: "Kedaluwarsa"
  };
  const TONE = { selesai: "ok", baru: "info", diproses: "info", siap: "info", menunggu_bayar: "warn", verifikasi: "warn", dibatalkan: "bad", gagal: "bad", kedaluwarsa: "bad" };

  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  let list = read();
  const docs = {};        // id -> data terbaru (pesanan sesi aktif, realtime)
  const hist = {};        // id -> data (pesanan lama, sekali ambil)
  const unsubs = {};
  let view = "";          // "" | trx | hist | move
  let tablesUnsub = null, tables = [], confirmId = "", busy = false;

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* diabaikan */ } };
  const prune = () => {
    const now = Date.now();
    list = list.filter((e) => now - e.ts < MAX_AGE).slice(0, MAX_N);
  };
  prune();

  const mode = () => Session.payConf().mode;
  const current = () => list.filter((e) => e.sid && e.sid === Session.sid());
  const data = (e) => docs[e.id] || hist[e.id] || null;
  const valid = (e) => { const d = docs[e.id]; return !d || !SKIP.includes(d.status); };
  const paid = (e) => !!(docs[e.id] && docs[e.id].payStatus === "lunas");
  const fmtDT = (ts) => new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(":", ".");

  /* ---------- Status pindah meja ---------- */
  function moveState() {
    if (!hasDb) return { ok: false, why: "Pindah meja membutuhkan koneksi ke server." };
    if (mode() === "off") return { ok: false, why: "Pindah meja aktif bila pembayaran lewat aplikasi diaktifkan oleh kedai." };
    if (Session.mode() !== "ok") return { ok: false, why: Session.blockText() || "Pindah meja hanya bisa saat sesi meja aktif dan kedai buka." };
    const cur = current().filter(valid);
    if (!cur.length) return { ok: false, why: "Pindah meja tersedia setelah kamu memesan dan membayar." };
    if (cur.some((e) => !paid(e))) return { ok: false, why: "Selesaikan pembayaran dulu untuk bisa pindah meja." };
    return { ok: true, why: "" };
  }

  /* ---------- Pemantauan pesanan sesi aktif ---------- */
  function watch() {
    const sid = Session.sid();
    list.forEach((e) => {
      const mine = e.sid && e.sid === sid;
      if (!mine && unsubs[e.id]) { unsubs[e.id](); delete unsubs[e.id]; }
      if (mine && hasDb && !unsubs[e.id]) {
        unsubs[e.id] = db.collection("orders").doc(e.id).onSnapshot((snap) => {
          if (snap.exists) { docs[e.id] = snap.data(); if (docs[e.id].mejaName) e.meja = docs[e.id].mejaName; }
          renderNav();
          if (view === "trx" || view === "hist" || view === "move") render();
        }, () => {});
      }
    });
  }

  function add(e) {
    list.unshift({ id: e.id, code: e.code, ts: Date.now(), sid: Session.sid(), mejaId: e.mejaId, meja: e.meja, total: e.total, items: e.items });
    prune(); save(); watch(); renderNav();
  }

  /* ---------- Tombol navigasi ---------- */
  function renderNav() {
    const ms = moveState();
    const b = $("#btnMove");
    b.classList.toggle("is-off", !ms.ok);
    b.title = ms.ok ? "" : ms.why;
    const unpaid = mode() === "off" ? 0 : current().filter((e) => valid(e) && !paid(e)).length;
    const tb = $("#trxBadge");
    tb.hidden = unpaid === 0;
    tb.textContent = unpaid;
  }

  /* ---------- Render panel ---------- */
  function open(v) {
    openPanel("navSheet");
    view = v;
    if (v === "move") listenTables();
    render();
  }

  function onClose() {
    if (!view) return;
    view = ""; confirmId = "";
    if (tablesUnsub) { tablesUnsub(); tablesUnsub = null; }
  }

  function statusChip(d) {
    const s = d ? d.status : "";
    return d ? `<span class="trx-chip ${TONE[s] || ""}">${esc(LABEL[s] || s)}</span>` : `<span class="trx-chip">-</span>`;
  }

  function card(e, withPay) {
    const d = data(e);
    const unpaid = withPay && mode() !== "off" && valid(e) && !paid(e);
    const payChip = withPay && mode() !== "off" && d && valid(e)
      ? (paid(e) ? `<span class="trx-chip ok">Lunas</span>` : `<span class="trx-chip warn">Belum dibayar</span>`) : "";
    const act = unpaid && mode() === "awal" && typeof Pay !== "undefined" && Pay.recId() === e.id
      ? `<button type="button" class="trx-btn" data-trx="pay">Lihat pembayaran</button>` : "";
    return `<div class="trx-card">
      <div class="trx-head"><b>${esc(e.code)}</b><span class="trx-chips">${statusChip(d)}${payChip}</span></div>
      <div class="trx-meta">${fmtDT(e.ts)} &middot; ${esc((d && d.mejaName) || e.meja || "-")}</div>
      <div class="trx-items">${(e.items || []).map((i) => `${i.qty}x ${esc(i.name)}`).join(", ")}</div>
      <div class="trx-foot"><b>${rupiah(e.total)}</b>${act}</div></div>`;
  }

  function render() {
    const body = $("#navBody"), foot = $("#navFoot"), title = $("#navTitle");
    foot.innerHTML = "";
    if (view === "trx") {
      title.textContent = "Transaksi";
      const cur = current();
      body.innerHTML = cur.length ? cur.map((e) => card(e, true)).join("")
        : `<div class="empty" style="grid-column:auto">${icon("receipt")}<div>Belum ada transaksi di sesi meja ini.</div></div>`;
      if (mode() === "akhir" && cur.some((e) => valid(e) && !paid(e))) {
        foot.innerHTML = `<button class="btn-primary btn-block" data-trx="bill">Bayar tagihan meja ${icon("arrow-right")}</button>`;
      }
    } else if (view === "hist") {
      title.textContent = "Riwayat";
      fetchHist();
      body.innerHTML = list.length ? list.map((e) => card(e, false)).join("")
        : `<div class="empty" style="grid-column:auto">${icon("history")}<div>Belum ada riwayat pesanan di perangkat ini.</div></div>`;
    } else if (view === "move") {
      renderMove(body, foot, title);
    }
    hydrateIcons();
  }

  // pesanan lama (sesi sebelumnya): ambil status terakhir sekali
  function fetchHist() {
    if (!hasDb) return;
    list.slice(0, 20).forEach((e) => {
      if (docs[e.id] || e.id in hist) return;
      hist[e.id] = null;
      db.collection("orders").doc(e.id).get().then((s) => { if (s.exists) { hist[e.id] = s.data(); if (view === "hist") render(); } }).catch(() => {});
    });
  }

  /* ---------- Pindah meja ---------- */
  function listenTables() {
    if (tablesUnsub || !hasDb) return;
    tablesUnsub = db.collection("tables").onSnapshot((snap) => {
      tables = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      if (view === "move") render();
    }, () => {});
  }

  function renderMove(body, foot, title) {
    title.textContent = "Pindah Meja";
    const ms = moveState();
    if (!ms.ok) {
      body.innerHTML = `<div class="done"><div class="done-ic">${icon("lock")}</div><h4>Pindah meja belum tersedia</h4><p>${esc(ms.why)}</p></div>`;
      return;
    }
    const me = Session.tableId();
    if (confirmId) {
      const t = tables.find((x) => x.id === confirmId);
      if (t) {
        body.innerHTML = `<div class="done"><div class="done-ic">${icon("swap")}</div><h4>Pindah ke ${esc(t.name)}?</h4>
          <p>Pesanan yang belum selesai akan diantar ke ${esc(t.name)}. ${esc(OUTLET.meja)} akan dikosongkan untuk pelanggan lain.</p></div>`;
        foot.innerHTML = `<button class="btn-primary btn-block" data-trx="go" data-id="${t.id}" ${busy ? "disabled" : ""}>${busy ? "Memindahkan..." : "Ya, pindahkan"}</button>
          <button class="btn-ghost btn-block" data-trx="cancel-move" style="margin-top:8px">Batal</button>`;
        return;
      }
    }
    body.innerHTML = `<p class="trx-note">Pilih meja kosong. Hanya meja berstatus Kosong yang bisa dipilih.</p><div class="move-grid">${tables.map((t) => {
      const here = t.id === me, free = !Session.isLive(t);
      return `<button type="button" class="move-item ${here ? "here" : free ? "free" : "busy"}" ${here || !free ? "disabled" : ""} data-trx="pick" data-id="${t.id}">
        <b>${esc(t.name)}</b><small>${esc(t.area || "-")}</small><em>${here ? "Meja kamu" : free ? "Kosong" : "Terisi"}</em></button>`;
    }).join("")}</div>`;
  }

  async function doMove(targetId) {
    const target = tables.find((x) => x.id === targetId);
    const old = Session.table();
    if (!target || !old || busy) return;
    if (!moveState().ok) { toast(moveState().why, "warn", "info"); return; }
    busy = true; render();
    try {
      const batch = db.batch();
      const up = { sessionId: Session.sid(), sessionOpenedAt: firebase.firestore.FieldValue.serverTimestamp(), movedFrom: old.id, movedTo: null };
      const until = old.sessionUntil && old.sessionUntil.toMillis ? old.sessionUntil : null;
      if (until) up.sessionUntil = until; // sisa waktu sesi ikut pindah
      batch.update(db.collection("tables").doc(target.id), up);
      batch.update(db.collection("tables").doc(old.id), { sessionId: "", sessionOpenedAt: null, sessionUntil: null, movedFrom: null, movedTo: target.id });
      const moved = current().filter((e) => valid(e) && docs[e.id] && MOVABLE.includes(docs[e.id].status));
      moved.forEach((e) => batch.update(db.collection("orders").doc(e.id), { mejaId: target.id, mejaName: target.name, area: target.area || "" }));
      await batch.commit();
      moved.forEach((e) => { e.mejaId = target.id; e.meja = target.name; });
      save();
      // perbarui aplikasi ke meja baru
      Session.switchTable(target, until);
      TABLE.id = target.id; TABLE.name = target.name; TABLE.area = target.area || "";
      OUTLET.meja = target.name; OUTLET.area = target.area || OUTLET.area;
      try { history.replaceState(null, "", "?meja=" + encodeURIComponent(target.id)); } catch (e) { /* diabaikan */ }
      confirmId = "";
      closeSheet();
      if (typeof onSession === "function") onSession();
      toast("Berhasil pindah ke " + target.name, "ok", "check");
      if (typeof Live !== "undefined" && Live.notify) Live.notify("info", "Pindah meja", `Kamu sekarang di ${target.name}. Pesanan akan diantar ke meja ini.`);
    } catch (e) {
      console.error(e);
      toast(e && e.code === "permission-denied" ? "Pindah ditolak: meja itu sudah terisi atau sesi berakhir." : "Gagal pindah meja. Coba lagi.", "warn", "x");
    } finally {
      busy = false;
      if (view === "move") render();
    }
  }

  /* ---------- Event ---------- */
  document.addEventListener("click", (e) => {
    const nav = e.target.closest("button");
    if (nav) {
      if (nav.id === "btnTrx") { open("trx"); return; }
      if (nav.id === "btnHist") { open("hist"); return; }
      if (nav.id === "btnMove") {
        const ms = moveState();
        if (!ms.ok) { toast(ms.why, "info", "lock"); return; }
        open("move"); return;
      }
    }
    const t = e.target.closest("[data-trx]");
    if (!t) return;
    const a = t.dataset.trx;
    if (a === "pay" && typeof Pay !== "undefined") Pay.open();
    if (a === "bill" && typeof Bill !== "undefined") Bill.open();
    if (a === "pick") { confirmId = t.dataset.id; render(); }
    if (a === "cancel-move") { confirmId = ""; render(); }
    if (a === "go") doMove(t.dataset.id);
  });

  (window.appReady || Promise.resolve()).then(() => {
    watch(); renderNav();
    Session.onChange(() => { watch(); renderNav(); if (view === "move") render(); });
    setInterval(renderNav, 5000);
  });

  return { add, onClose };
})();
