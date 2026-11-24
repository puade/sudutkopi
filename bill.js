/* ==========================
   Outletmu - bill.js
   Mode "bayar setelah makan" (payMode = akhir):
   pesanan langsung ke dapur; pelanggan membuka TAGIHAN berisi pesanan perangkat ini
   yang belum dibayar, lalu membayar sekaligus lewat Transfer atau Tunai.
   Pembayaran dibuat sebagai dokumen payments/{id} dan diproses oleh kartu pembayaran di pay.js.
   Dimuat setelah pay.js.
   ========================== */

const Bill = (() => {
  const KEY = "outletmu_bill";
  const hasDb = typeof db !== "undefined";
  const SKIP = ["dibatalkan", "gagal", "kedaluwarsa"];
  let st = { sid: "", items: [] }; // items: [{ id, code, total }]
  let viewing = false;
  let list = [];   // pesanan valid yang sedang ditampilkan
  let busy = false;

  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && Array.isArray(v.items)) st = v; } catch (e) { /* diabaikan */ } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* diabaikan */ } };
  const sum = () => st.items.reduce((a, i) => a + (i.total || 0), 0);
  const modeAkhir = () => Session.payConf().mode === "akhir";

  function sync() { // pelanggan/sesi baru -> tagihan lama dibuang
    const sid = Session.sid();
    if (st.sid !== sid) { st = { sid, items: [] }; save(); }
  }

  function add(id, code, total) {
    sync();
    st.items.push({ id, code, total });
    save();
    renderBar();
  }

  function remove(ids) {
    st.items = st.items.filter((i) => !ids.includes(i.id));
    save();
    renderBar();
  }

  function renderBar() {
    const bar = $("#billBar");
    if (!bar) return;
    const sheetOpen = $("#sheet").classList.contains("show");
    const show = modeAkhir() && st.sid === Session.sid() && st.items.length && Session.holdsTable()
      && !(typeof Pay !== "undefined" && (Pay.active() || Pay.hasRec())) && !sheetOpen && !viewing;
    bar.hidden = !show;
    if (show) bar.innerHTML = `<span>Tagihan meja &middot; ${st.items.length} pesanan &middot; ${rupiah(sum())}</span><button type="button" data-bill="open">Bayar</button>`;
  }

  /* ---------- Tampilan tagihan ---------- */
  async function open() {
    sync();
    showSheetRaw();
    viewing = true;
    $("#sheetTitle").textContent = "Tagihan Meja";
    $("#sheetBody").innerHTML = '<div class="empty" style="grid-column:auto">Memuat tagihan...</div>';
    $("#sheetFoot").innerHTML = "";
    renderBar();
    try {
      const docs = await Promise.all(st.items.map((i) => db.collection("orders").doc(i.id).get()));
      list = [];
      const drop = [];
      docs.forEach((d, n) => {
        const it = st.items[n];
        const o = d.exists ? d.data() : null;
        if (!o || SKIP.includes(o.status) || o.payStatus === "lunas") drop.push(it.id);
        else list.push({ id: it.id, code: o.code || it.code, total: o.total || 0, items: o.items || [], status: o.status });
      });
      if (drop.length) remove(drop);
    } catch (e) {
      console.warn("Tagihan gagal dimuat:", e.code || e.message);
      list = st.items.map((i) => ({ id: i.id, code: i.code, total: i.total, items: [], status: "baru" }));
    }
    render();
  }

  function render() {
    if (!viewing) return;
    const body = $("#sheetBody"), foot = $("#sheetFoot");
    if (!list.length) {
      body.innerHTML = `<div class="done"><div class="done-ic">${icon("check")}</div><h4>Tidak ada tagihan</h4><p>Semua pesananmu sudah lunas atau dibatalkan.</p></div>`;
      foot.innerHTML = `<button class="btn-primary btn-block" id="btnBillClose">Kembali ke Menu</button>`;
      return;
    }
    const total = list.reduce((a, o) => a + o.total, 0);
    const f = Session.fee(total);
    const pc = Session.payConf();
    const avail = [pc.transfer && "transfer", pc.cash && "cash"].filter(Boolean);
    if (!avail.includes(state.payMethod)) state.payMethod = avail[0] || "";
    const both = avail.length === 2;
    const toggle = avail.length ? `<div class="pay-pick"><div class="pay-pick-label">Metode pembayaran</div>
      <div class="pay-toggle ${both ? "" : "single"} ${state.payMethod === "cash" && both ? "right" : ""}"><i class="pt-thumb"></i>
        ${avail.map((m) => `<button type="button" data-pay="${m}" class="${state.payMethod === m ? "on" : ""}">${m === "transfer" ? "Transfer" : "Tunai"}</button>`).join("")}</div>
      <div class="pay-pick-note">${state.payMethod === "transfer" ? "Bayar lewat QRIS atau rekening, lalu unggah bukti transfer." : "Bayar di kasir dengan menunjukkan kode pembayaran."}</div></div>`
      : `<div class="sheet-block">${icon("info")}<span>Metode pembayaran belum tersedia. Hubungi kasir.</span></div>`;
    body.innerHTML = list.map((o) => `<div class="bill-order">
        <div class="bill-head"><b>${esc(o.code)}</b><span>${rupiah(o.total)}</span></div>
        <div class="bill-lines">${o.items.map((i) => `${i.qty}x ${esc(i.name)}`).join(", ")}</div></div>`).join("");
    foot.innerHTML = `
      <div class="row-sum"><span>Jumlah pesanan</span><span>${list.length}</span></div>
      <div class="row-sum total"><span>Total tagihan</span><span>${rupiah(total)}</span></div>
      ${f ? `<div class="fee-box"><div class="fee-title">Rincian (sudah termasuk dalam harga)</div>
        <div class="fee-row"><span>Harga sebelum layanan &amp; pajak</span><span>${rupiah(f.base)}</span></div>
        ${f.sRate ? `<div class="fee-row"><span>Layanan ${f.sRate}%</span><span>${rupiah(f.service)}</span></div>` : ""}
        ${f.tRate ? `<div class="fee-row"><span>Pajak ${f.tRate}%</span><span>${rupiah(f.tax)}</span></div>` : ""}</div>` : ""}
      ${toggle}
      <button class="btn-primary btn-block" id="btnBillPay" ${avail.length ? "" : "disabled"}>Bayar Sekarang ${icon("arrow-right")}</button>`;
  }

  async function pay() {
    if (busy || !list.length) return;
    busy = true;
    const btn = $("#btnBillPay");
    if (btn) btn.disabled = true;
    const total = list.reduce((a, o) => a + o.total, 0);
    const code = "PAY-" + String(Math.floor(100000 + Math.random() * 900000));
    try {
      const ref = await db.collection("payments").add({
        code, mejaId: Session.tableId(), mejaName: OUTLET.meja || "", sessionId: Session.sid(),
        orderIds: list.map((o) => o.id), lines: list.map((o) => ({ code: o.code, total: o.total })), total,
        status: "menunggu_bayar", payMethod: state.payMethod, proofs: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      viewing = false;
      Pay.begin({ id: ref.id, code, total, method: state.payMethod, meja: OUTLET.meja, coll: "payments" });
      Pay.open();
    } catch (e) {
      console.error(e);
      toast(e && e.code === "permission-denied"
        ? "Tagihan tidak bisa dibuat: meja sudah dikosongkan atau metode belum aktif."
        : "Gagal membuat tagihan. Coba lagi.", "warn", "x");
      if (btn) btn.disabled = false;
    } finally {
      busy = false;
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-bill="open"]')) { open(); return; }
    const id = e.target.closest("button")?.id;
    if (id === "btnBillPay") pay();
    if (id === "btnBillClose") closeSheet();
  });

  setInterval(renderBar, 1500);

  (window.appReady || Promise.resolve()).then(() => {
    load(); sync(); renderBar();
    Session.onChange(() => { sync(); renderBar(); });
  });

  return {
    add, remove, render, renderBar,
    isOpen: () => viewing,
    onClose: () => { viewing = false; setTimeout(renderBar, 30); }, // panel baru tertutup setelah hook ini dipanggil
    leave: () => { viewing = false; }
  };
})();
