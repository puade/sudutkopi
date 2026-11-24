/* ==========================
   Outletmu - pay.js
   Pembayaran sisi pelanggan (mode "bayar di awal"):
     Transfer : QRIS / rekening kedai + unggah bukti (maks 3 kali, batas 15 menit) -> admin memverifikasi
     Tunai    : kartu "Bayar di Kasir" (batas 30 menit) -> kasir menekan "Terima tunai"
   Status pesanan:
     menunggu_bayar -> (transfer) verifikasi -> baru (Pesanan Terkirim) | menunggu_bayar (bukti ditolak) | gagal
                    -> (tunai)    baru
                    -> kedaluwarsa bila waktu habis
   Dimuat setelah app.js & live.js.
   ========================== */

const Pay = (() => {
  const KEY = "outletmu_pay";
  const TRANSFER_MS = 15 * 60 * 1000;
  const CASH_MS = 30 * 60 * 1000;
  const MAX_PROOF = 3; // 1 kiriman awal + 2 kirim ulang
  const hasDb = typeof db !== "undefined";

  let rec = null;       // { id, code, total, method, meja }
  let order = null;     // data pesanan terbaru
  let unsub = null;
  let viewing = false;
  let picked = null;    // berkas bukti yang dipilih
  let pickedUrl = "";
  let busy = false;
  let lastSig = "";

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const write = () => { try { rec ? localStorage.setItem(KEY, JSON.stringify(rec)) : localStorage.removeItem(KEY); } catch (e) { /* diabaikan */ } };
  const ms = (v) => (v && v.toMillis ? v.toMillis() : typeof v === "number" ? v : 0);
  const mmss = (n) => { n = Math.max(0, Math.ceil(n / 1000)); return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); };
  const WAITING = ["menunggu_bayar", "verifikasi"];

  function deadline() {
    if (!order || !rec) return 0;
    const created = ms(order.createdAt) || Date.now();
    return created + (rec.method === "cash" ? CASH_MS : TRANSFER_MS);
  }
  const expired = () => order && order.status === "menunggu_bayar" && Date.now() > deadline();
  const attemptsLeft = () => MAX_PROOF - ((order && order.proofs) || []).length;

  /* Ada pesanan yang masih harus diselesaikan pembayarannya? */
  function active() {
    return !!(rec && order && WAITING.includes(order.status) && !expired());
  }

  /* ---------- Siklus ---------- */
  function begin(info) {
    rec = { id: info.id, code: info.code, total: info.total, method: info.method, meja: info.meja };
    order = null;
    picked = null; lastSig = "";
    write();
    watch();
  }

  function clear() {
    if (unsub) { unsub(); unsub = null; }
    rec = null; order = null; picked = null; viewing = false; lastSig = "";
    write();
    renderBar();
    if (typeof onSession === "function") onSession(); // buka kembali tombol pesan
  }

  function watch() {
    if (!hasDb || !rec || unsub) return;
    unsub = db.collection("orders").doc(rec.id).onSnapshot((snap) => {
      if (!snap.exists) { clear(); return; }
      order = snap.data({ serverTimestamps: "estimate" });
      if (!WAITING.includes(order.status) && !viewing) { clear(); return; }
      renderBar();
      if (viewing) {
        const sig = [order.status, (order.proofs || []).length, order.payNote || "", expired()].join("|");
        if (sig !== lastSig) renderPay();
      }
      if (typeof onSession === "function") onSession(); // perbarui tombol pesan (active() berubah)
    }, () => { /* diabaikan */ });
  }

  /* ---------- Bar pengingat ---------- */
  function renderBar() {
    const bar = $("#payBar");
    if (!bar) return;
    if (!rec || !order || viewing || !(WAITING.includes(order.status))) { bar.hidden = true; return; }
    let t;
    if (order.status === "verifikasi") t = "Bukti transfer sedang diproses";
    else if (expired()) t = "Waktu pembayaran habis";
    else t = (rec.method === "cash" ? "Bayar di kasir " : "Selesaikan pembayaran ") + rec.code + " · sisa " + mmss(deadline() - Date.now());
    bar.hidden = false;
    bar.innerHTML = `<span>${esc(t)}</span><button type="button" data-pay-act="open">Lihat</button>`;
  }

  /* ---------- Salin ---------- */
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (x) { /* diabaikan */ }
      ta.remove();
    }
    toast("Disalin", "ok", "check");
  }

  /* ---------- Tampilan kartu ---------- */
  function open() {
    if (!rec) return;
    showSheetRaw(); // (menutup panel lain -> memicu onClose, jadi tandai viewing sesudahnya)
    viewing = true; lastSig = "";
    renderBar();
    renderPay();
  }

  function onClose() {
    if (!viewing) return;
    viewing = false;
    if (order && !WAITING.includes(order.status)) { clear(); return; }
    renderBar();
  }

  const doneCard = (icon_, title, text, extra = "") => `
    <div class="done"><div class="done-ic">${icon(icon_)}</div><h4>${title}</h4><p>${text}</p>${extra}</div>`;

  function renderPay() {
    const body = $("#sheetBody"), foot = $("#sheetFoot"), title = $("#sheetTitle");
    if (!order) { title.textContent = "Pembayaran"; body.innerHTML = '<div class="empty" style="grid-column:auto">Memuat...</div>'; foot.innerHTML = ""; return; }
    lastSig = [order.status, (order.proofs || []).length, order.payNote || "", expired()].join("|");
    const cfg = Session.payConf();
    const st = order.status;
    const closeFoot = `<button class="btn-primary btn-block" id="btnPayClose">Kembali ke Menu</button>`;

    if (st === "menunggu_bayar" && expired()) {
      title.textContent = "Waktu Pembayaran Habis";
      body.innerHTML = doneCard("x", "Pesanan dibatalkan otomatis", `Pembayaran untuk ${esc(rec.code)} tidak diterima tepat waktu. Silakan pesan ulang.`);
      foot.innerHTML = closeFoot; return;
    }
    if (st === "kedaluwarsa") {
      title.textContent = "Waktu Pembayaran Habis";
      body.innerHTML = doneCard("x", "Pesanan dibatalkan otomatis", `Pembayaran untuk ${esc(rec.code)} tidak diterima tepat waktu. Silakan pesan ulang.`);
      foot.innerHTML = closeFoot; return;
    }
    if (st === "gagal") {
      title.textContent = "Pesanan Gagal";
      body.innerHTML = doneCard("x", "Pesanan Gagal", esc(order.payNote || "Pembayaran tidak dapat diverifikasi.") + "<br>Hubungi admin lewat chat jika ada pertanyaan.", `<span class="code">${esc(rec.code)}</span>`);
      foot.innerHTML = closeFoot; return;
    }
    if (st === "dibatalkan") {
      title.textContent = "Pesanan Dibatalkan";
      const rf = order.refundAmount ? `Refund ${rupiah(order.refundAmount)} akan diproses kasir.` : "";
      body.innerHTML = doneCard("x", "Pesanan dibatalkan", esc(rf), `<span class="code">${esc(rec.code)}</span>`);
      foot.innerHTML = closeFoot; return;
    }
    if (st === "verifikasi") {
      const last = (order.proofs || []).slice(-1)[0];
      title.textContent = "Pembayaran";
      body.innerHTML = `<div class="done"><div class="done-ic spin-ic">${icon("clock")}</div><h4>Bukti transfer sedang diproses</h4>
        <p>Admin sedang memeriksa bukti transfer Anda. Halaman ini akan berubah otomatis.</p>
        ${last ? `<img class="proof-thumb" src="${esc(last.url)}" alt="Bukti transfer">` : ""}
        <span class="code">${esc(rec.code)}</span></div>`;
      foot.innerHTML = `<button class="btn-primary btn-block" id="btnPayClose">Tutup</button>`;
      return;
    }
    if (st !== "menunggu_bayar") { // baru / diproses / siap / selesai
      title.textContent = "Pesanan Terkirim";
      body.innerHTML = doneCard("check", "Pesanan Terkirim", `Pembayaran diterima. Pesanan Anda sedang disiapkan dan akan diantar ke ${esc(rec.meja)}.`, `<span class="code">${esc(rec.code)}</span>`);
      foot.innerHTML = closeFoot; return;
    }

    // ---- menunggu_bayar ----
    const warn = order.payNote
      ? `<div class="sheet-block warn">${icon("info")}<span>Bukti sebelumnya ditolak: ${esc(order.payNote)}. Silakan kirim ulang (sisa ${attemptsLeft()} kali).</span></div>` : "";
    const timer = `<div class="pay-timer">${icon("clock")}<span>Selesaikan dalam <b id="payTimer">${mmss(deadline() - Date.now())}</b></span></div>`;
    const amount = `<div class="pay-amount"><small>Total pembayaran</small><b>${rupiah(rec.total)}</b>
      ${rec.method === "transfer" ? `<button type="button" class="copy-btn" data-copy="${rec.total}">${icon("copy")}Salin nominal</button>` : ""}</div>`;

    if (rec.method === "cash") {
      title.textContent = "Bayar di Kasir";
      body.innerHTML = `${amount}${timer}
        <div class="cash-card"><small>Tunjukkan kode ini ke kasir</small><b>${esc(rec.code)}</b>
        <p>Pesanan baru masuk ke dapur setelah kasir menerima pembayaran tunai Anda. ${esc(rec.meja)}</p></div>`;
      foot.innerHTML = `<button class="btn-primary btn-block" id="btnPayClose">Tutup</button>`;
      return;
    }

    title.textContent = "Pembayaran Transfer";
    const qris = cfg.qrisUrl
      ? `<div class="pay-block"><div class="pay-label">QRIS</div><img class="qris-img" src="${esc(cfg.qrisUrl)}" alt="QRIS">
          <div class="qris-note">Masukkan nominal sesuai total. QRIS ini tidak membawa nominal otomatis.</div>
          <a class="link-btn" href="${esc(cfg.qrisUrl)}" download="qris.jpg" target="_blank" rel="noopener">${icon("download")}Simpan QR</a></div>` : "";
    const bank = cfg.accNo
      ? `<div class="pay-block"><div class="pay-label">Transfer Bank</div>
          <div class="bank-row"><div><b>${esc(cfg.bankName || "Rekening")}</b><div class="acc">${esc(cfg.accNo)}</div><small>a.n. ${esc(cfg.accName || "-")}</small></div>
          <button type="button" class="copy-btn" data-copy="${esc(cfg.accNo)}">${icon("copy")}Salin</button></div></div>` : "";
    body.innerHTML = `${amount}${timer}${warn}${qris}${bank}
      <div class="pay-block"><div class="pay-label">Unggah bukti transfer</div>
        <label class="upload-box"><input type="file" accept="image/*" id="proofFile" hidden>
          <span id="proofHint">${icon("image")}<span>${picked ? esc(picked.name) : "Pilih foto bukti transfer"}</span></span></label>
        <img class="proof-thumb" id="proofPrev" alt="" ${pickedUrl ? `src="${pickedUrl}"` : "hidden"}>
        <div class="qris-note">Sisa percobaan kirim: ${attemptsLeft()} kali.</div></div>`;
    foot.innerHTML = `<button class="btn-primary btn-block" id="btnSendProof" ${picked ? "" : "disabled"}>Kirim bukti</button>`;
    hydrateIcons();
  }

  /* ---------- Unggah bukti ---------- */
  function shrink(file) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob((b) => (b ? res(b) : rej(new Error("Gambar gagal diproses"))), "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Gambar tidak dapat dibaca")); };
      img.src = u;
    });
  }

  async function upload(blob) {
    const fd = new FormData();
    fd.append("file", blob, "bukti.jpg");
    fd.append("upload_preset", CLOUDINARY.proofPreset);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok || !j.secure_url) throw new Error((j.error && j.error.message) || "Unggahan gagal");
    return j.secure_url;
  }

  function pick(file) {
    if (pickedUrl) { URL.revokeObjectURL(pickedUrl); pickedUrl = ""; }
    picked = null;
    if (file) {
      if (!/^image\//.test(file.type)) { toast("Pilih berkas gambar (JPG/PNG).", "warn", "x"); }
      else if (file.size > 12 * 1024 * 1024) { toast("Ukuran gambar maksimal 12 MB.", "warn", "x"); }
      else { picked = file; pickedUrl = URL.createObjectURL(file); }
    }
    renderPay();
  }

  async function sendProof() {
    if (!picked || busy || !order) return;
    if (attemptsLeft() <= 0) { toast("Batas kirim bukti tercapai. Hubungi admin lewat chat.", "warn", "x"); return; }
    busy = true;
    const btn = $("#btnSendProof");
    if (btn) { btn.disabled = true; btn.textContent = "Mengunggah..."; }
    try {
      const url = await upload(await shrink(picked));
      await db.collection("orders").doc(rec.id).update({
        proofs: [...(order.proofs || []), { url, at: Date.now() }],
        status: "verifikasi"
      });
      if (typeof Live !== "undefined" && Live.sendImage) Live.sendImage(url, `Bukti transfer ${rec.code}`); // salinan ke chat admin (upaya terbaik)
      if (pickedUrl) URL.revokeObjectURL(pickedUrl);
      picked = null; pickedUrl = "";
      toast("Bukti transfer terkirim", "ok", "check");
    } catch (e) {
      console.error(e);
      toast(e && e.code === "permission-denied"
        ? "Bukti ditolak sistem: waktu bayar habis atau batas kirim tercapai."
        : "Gagal mengirim bukti. Coba lagi.", "warn", "x");
      if (btn) { btn.disabled = false; btn.textContent = "Kirim bukti"; }
    } finally {
      busy = false;
    }
  }

  /* ---------- Event ---------- */
  document.addEventListener("click", (e) => {
    const cp = e.target.closest("[data-copy]");
    if (cp) { copy(cp.dataset.copy); return; }
    if (e.target.closest('[data-pay-act="open"]')) { open(); return; }
    const id = e.target.closest("button")?.id;
    if (id === "btnPayClose") { closeSheet(); }
    if (id === "btnSendProof") sendProof();
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "proofFile") pick(e.target.files && e.target.files[0]);
  });

  /* ---------- Detak 1 detik: hitung mundur & kedaluwarsa ---------- */
  setInterval(() => {
    if (!rec || !order) return;
    const t = $("#payTimer");
    if (viewing && t && order.status === "menunggu_bayar") {
      const left = deadline() - Date.now();
      if (left <= 0) renderPay(); else t.textContent = mmss(left);
    }
    renderBar();
    if (expired() && typeof onSession === "function") onSession();
  }, 1000);

  /* ---------- Mulai ---------- */
  function init() {
    if (Session.changedSince("outletmu_pay_sid")) { rec = null; write(); }
    else rec = read();
    if (rec) watch();
    renderBar();
    Session.onChange(() => { if (Session.changedSince("outletmu_pay_sid")) clear(); });
  }
  (window.appReady || Promise.resolve()).then(init);

  return { begin, open, onClose, active, leave: () => { viewing = false; renderBar(); } };
})();
