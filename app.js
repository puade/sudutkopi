/* ==========================
   Outletmu - app.js
   ========================== */

/* ---------- Ikon (SVG inline, tanpa emoji) ---------- */
const ICONS = {
  logo: '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" fill="#127a50"/><path d="M10 26c6-12 22-14 28-6-8-2-16 0-20 8-3 5-6 4-8-2z" fill="#fff"/><path d="M14 33c8 5 19 3 24-7" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a2 2 0 0 0 2 2v9"/><path d="M10 3v7a2 2 0 0 1-2 2"/><path d="M8 3v5"/><path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8 0 1.5 1 2 2 2h1.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.5l2 11h10l2-8H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="16.5" cy="19.5" r="1.4"/></svg>',
  "arrow-right": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  star: '<svg viewBox="0 0 24 24" stroke-width="1.5" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  coffee: '<svg class="ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8.5 11h5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
  cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
};
const icon = (n) => ICONS[n] || "";
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    if (!el.dataset.done) { el.innerHTML = icon(el.dataset.icon); el.dataset.done = "1"; }
  });
}

/* ---------- Util ---------- */
const $ = (s) => document.querySelector(s);
const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const findItem = (id) => MENU.find((x) => String(x.id) === String(id));

/* ---------- State ---------- */
const state = {
  cat: "Semua",
  q: "",
  showAll: false,
  payMethod: "transfer",
  cart: loadCart()
};
function loadCart() {
  try { return JSON.parse(localStorage.getItem("outletmu_cart")) || {}; } catch (e) { return {}; }
}
function saveCart() {
  try { localStorage.setItem("outletmu_cart", JSON.stringify(state.cart)); } catch (e) {}
}

/* ---------- Render: outlet info ---------- */
function renderOutlet() {
  // Brand di header: logo (opsional) + nama brand (opsional)
  const bn = $("#brandName"), lg = $("#brandLogo");
  bn.textContent = OUTLET.brandName || "";
  bn.hidden = !OUTLET.brandName;
  lg.onerror = () => { lg.hidden = true; };
  if (OUTLET.logo) { lg.src = OUTLET.logo; lg.hidden = false; } else { lg.hidden = true; }
  document.title = OUTLET.brandName || OUTLET.name;

  $("#outletName").textContent = OUTLET.name;
  $("#outletTagline").textContent = OUTLET.tagline;
  $(".badge").textContent = OUTLET.badge;
  $("#infoMeja").textContent = OUTLET.meja;
  $("#infoJam").textContent = Session.hoursText() || OUTLET.jamBuka;
  $("#infoArea").textContent = OUTLET.area;
  const sm = Number(REMOTE.cfg.sessionMinutes);
  $("#sessionText").textContent = sm ? (sm % 60 === 0 ? sm / 60 + " jam" : sm + " menit") : OUTLET.sesi;
  $("#heroImg").style.backgroundImage = `url('${OUTLET.heroImg}')`;
}

/* ---------- Render: chips ---------- */
function renderChips() {
  $("#chips").innerHTML = CATEGORIES.map(
    (c) => `<button class="chip ${c === state.cat ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join("");
}

/* ---------- Render: menu ---------- */
function visibleItems() {
  const q = state.q.trim().toLowerCase();
  if (q) return MENU.filter((m) => (m.name + " " + m.desc + " " + m.cat).toLowerCase().includes(q));
  if (state.cat !== "Semua") return MENU.filter((m) => m.cat === state.cat);
  return state.showAll ? MENU : MENU.filter((m) => m.fav);
}

function actionHTML(m) {
  const qty = state.cart[m.id] || 0;
  if (!Session.canOrder()) {
    // mode lihat-saja: kedai tutup / sesi meja berakhir / bukan dari QR meja
    return qty > 0
      ? `<div class="qty-mini is-disabled"><span>${qty}</span></div>`
      : `<button class="add-btn" disabled aria-disabled="true" aria-label="Pemesanan tidak tersedia">${icon("plus")}</button>`;
  }
  if (qty > 0) {
    return `<div class="qty-mini">
      <button data-act="dec" data-id="${m.id}" aria-label="Kurangi">${icon("minus")}</button>
      <span>${qty}</span>
      <button data-act="inc" data-id="${m.id}" aria-label="Tambah">${icon("plus")}</button>
    </div>`;
  }
  return `<button class="add-btn" data-act="inc" data-id="${m.id}" aria-label="Tambah ${esc(m.name)}">${icon("plus")}</button>`;
}

function imgHTML(m, cls) {
  return `<div class="${cls}" style="background-image:url('${m.img}')" data-bg="${m.img}">${m.best ? `<span class="tag">${icon("star")}Best Seller</span>` : ""}</div>`;
}

function cardHTML(m) {
  if (m.layout === "row") {
    return `<article class="card row">
      ${imgHTML(m, "card-img")}
      <div class="card-body">
        <div>
          <div class="card-name">${esc(m.name)}</div>
          <div class="card-desc">${esc(m.desc)}</div>
        </div>
        <div class="row-foot">
          <div class="card-price">${rupiah(m.price)}</div>
          ${actionHTML(m)}
        </div>
      </div>
    </article>`;
  }
  return `<article class="card">
    ${imgHTML(m, "card-img")}
    <div class="card-body">
      <div>
        <div class="card-name">${esc(m.name)}</div>
        <div class="card-price">${rupiah(m.price)}</div>
      </div>
      ${actionHTML(m)}
    </div>
  </article>`;
}

function renderMenu() {
  const items = visibleItems();
  const q = state.q.trim();
  let title = "Menu favorit";
  if (q) title = "Hasil pencarian";
  else if (state.cat !== "Semua") title = state.cat;
  else if (state.showAll) title = "Semua menu";
  $("#menuTitle").textContent = title;

  const btnAll = $("#btnAll");
  btnAll.classList.toggle("hidden", !!q || state.cat !== "Semua");
  btnAll.innerHTML = (state.showAll ? "Lihat favorit " : "Lihat semua ") + icon("arrow-right");

  const grid = $("#menuGrid");
  if (!items.length) {
    grid.innerHTML = `<div class="empty">${icon("empty")}Menu tidak ditemukan.</div>`;
    return;
  }
  grid.innerHTML = items.map(cardHTML).join("");
  attachImageFallback(grid);
}

/* Fallback jika gambar gagal dimuat */
function attachImageFallback(root) {
  root.querySelectorAll("[data-bg]").forEach((el) => {
    const probe = new Image();
    probe.onerror = () => {
      el.style.backgroundImage = "";
      el.insertAdjacentHTML("beforeend", icon("coffee"));
    };
    probe.src = el.dataset.bg;
  });
}

/* ---------- Cart ---------- */
function cartTotals() {
  let count = 0, total = 0;
  Object.entries(state.cart).forEach(([id, qty]) => {
    const m = findItem(id);
    if (m) { count += qty; total += qty * m.price; }
  });
  return { count, total };
}

function renderCartBar(bump) {
  const { count, total } = cartTotals();
  const bar = $("#cartBar");
  bar.classList.toggle("hidden", count === 0);
  $("#cartCount").textContent = count;
  $("#cartItemsText").textContent = `${count} item di keranjang`;
  $("#cartTotalText").textContent = `Total ${rupiah(total)}`;
  document.body.classList.toggle("has-cart", count > 0); // menggeser tombol chat agar tidak menimpa bar keranjang
  if (bump) { bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump"); }
}

function changeQty(id, delta) {
  if (delta > 0 && !Session.canOrder()) { toast(Session.blockText(), "warn", "info"); return; }
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id]; else state.cart[id] = next;
  saveCart();
  renderMenu();
  renderCartBar(delta > 0);
  if ($("#sheet").classList.contains("show") && !orderDone) renderSheet();
}

/* ---------- Sheet ---------- */
let orderDone = false;

function showSheetRaw() { // menampilkan panel keranjang tanpa merender ulang isinya (dipakai kartu pembayaran)
  orderDone = true;
  closeSheet();
  $("#overlay").classList.add("show");
  $("#sheet").classList.add("show");
  $("#sheet").setAttribute("aria-hidden", "false");
}

function openSheet() {
  if (typeof Pay !== "undefined") Pay.leave();
  orderDone = false;
  renderSheet();
  $("#overlay").classList.add("show");
  $("#sheet").classList.add("show");
  $("#sheet").setAttribute("aria-hidden", "false");
}
function closeSheet() {
  if (typeof Pay !== "undefined" && $("#sheet").classList.contains("show")) Pay.onClose();
  // menutup semua panel (keranjang, notifikasi, chat)
  $("#overlay").classList.remove("show");
  document.querySelectorAll(".sheet").forEach((s) => {
    s.classList.remove("show");
    s.setAttribute("aria-hidden", "true");
  });
}
function openPanel(id) {
  closeSheet();
  $("#overlay").classList.add("show");
  $("#" + id).classList.add("show");
  $("#" + id).setAttribute("aria-hidden", "false");
}

function renderSheet() {
  const entries = Object.entries(state.cart)
    .map(([id, qty]) => ({ m: findItem(id), qty }))
    .filter((e) => e.m);
  const { count, total } = cartTotals();
  $("#sheetTitle").textContent = "Keranjang";

  if (!entries.length) {
    $("#sheetBody").innerHTML = `<div class="empty" style="grid-column:auto">${icon("cart")}<div style="margin-top:6px">Keranjang masih kosong.</div></div>`;
    $("#sheetBody").querySelector("svg").style.cssText = "width:44px;height:44px;margin:0 auto;opacity:.5";
    $("#sheetFoot").innerHTML = "";
    return;
  }

  $("#sheetBody").innerHTML =
    entries.map(({ m, qty }) => `
      <div class="ci">
        <div class="ci-img" style="background-image:url('${m.img}')"></div>
        <div class="ci-info">
          <div class="ci-name">${esc(m.name)}</div>
          <div class="ci-price">${rupiah(m.price)}</div>
        </div>
        <div class="qty-mini">
          <button data-act="dec" data-id="${m.id}" aria-label="Kurangi">${icon("minus")}</button>
          <span>${qty}</span>
          <button data-act="inc" data-id="${m.id}" aria-label="Tambah">${icon("plus")}</button>
        </div>
        <button class="ci-del" data-act="del" data-id="${m.id}" aria-label="Hapus">${icon("trash")}</button>
      </div>`).join("") +
    `<textarea class="note" id="orderNote" rows="2" placeholder="Catatan pesanan (opsional)"></textarea>`;

  const f = Session.fee(total);
  const feeHTML = f ? `
    <div class="fee-box">
      <div class="fee-title">Rincian (sudah termasuk dalam harga)</div>
      <div class="fee-row"><span>Harga sebelum layanan &amp; pajak</span><span>${rupiah(f.base)}</span></div>
      ${f.sRate ? `<div class="fee-row"><span>Layanan ${f.sRate}%</span><span>${rupiah(f.service)}</span></div>` : ""}
      ${f.tRate ? `<div class="fee-row"><span>Pajak ${f.tRate}%</span><span>${rupiah(f.tax)}</span></div>` : ""}
    </div>` : "";
  const pc = Session.payConf();
  let payHTML = "";
  let block = Session.blockText();
  if (pc.mode === "awal") {
    const avail = [pc.transfer && "transfer", pc.cash && "cash"].filter(Boolean);
    if (!avail.includes(state.payMethod)) state.payMethod = avail[0] || "";
    if (!avail.length) { block = block || "Metode pembayaran belum tersedia. Hubungi kasir."; }
    else {
      const both = avail.length === 2;
      payHTML = `<div class="pay-pick"><div class="pay-pick-label">Metode pembayaran</div>
        <div class="pay-toggle ${both ? "" : "single"} ${state.payMethod === "cash" && both ? "right" : ""}">
          <i class="pt-thumb"></i>
          ${avail.map((m) => `<button type="button" data-pay="${m}" class="${state.payMethod === m ? "on" : ""}">${m === "transfer" ? "Transfer" : "Tunai"}</button>`).join("")}
        </div>
        <div class="pay-pick-note">${state.payMethod === "transfer" ? "Bayar lewat QRIS atau rekening, lalu unggah bukti transfer." : "Bayar di kasir dengan menunjukkan kode pesanan."}</div></div>`;
    }
  }
  if (!block && typeof Pay !== "undefined" && Pay.active()) block = "Selesaikan dulu pembayaran pesanan sebelumnya.";
  $("#sheetFoot").innerHTML = `
    <div class="row-sum"><span>Jumlah item</span><span>${count}</span></div>
    <div class="row-sum total"><span>Total</span><span>${rupiah(total)}</span></div>
    ${feeHTML}
    ${payHTML}
    ${block ? `<div class="sheet-block">${icon("info")}<span>${esc(block)}</span></div>` : ""}
    <button class="btn-primary btn-block" id="btnOrder" ${block ? "disabled" : ""}>Pesan Sekarang ${icon("arrow-right")}</button>`;
}

/* Tampilan status (kedai tutup / sesi berakhir / bukan dari QR) */
function renderStateBar() {
  const t = Session.blockText();
  const bar = $("#stateBar");
  bar.hidden = !t;
  bar.innerHTML = t ? icon("info") + `<span>${esc(t)}</span>` : "";
}

/* Dipanggil saat mode sesi / jam buka berubah */
function onSession() {
  if (Session.changedSince("outletmu_cart_sid")) { state.cart = {}; saveCart(); } // pelanggan baru di meja ini
  renderOutlet();
  renderStateBar();
  renderMenu();
  renderCartBar();
  if ($("#sheet").classList.contains("show") && !orderDone) renderSheet();
  hydrateIcons();
}

async function placeOrder() {
  const btn = $("#btnOrder");
  const entries = Object.entries(state.cart)
    .map(([id, qty]) => ({ m: findItem(id), qty }))
    .filter((e) => e.m);
  if (!entries.length) return;
  if (!Session.canOrder()) { toast(Session.blockText(), "warn", "info"); return; }
  if (typeof Pay !== "undefined" && Pay.active()) { toast("Selesaikan dulu pembayaran pesanan sebelumnya.", "warn", "info"); return; }
  const pc = Session.payConf();
  const awal = pc.mode === "awal";
  if (awal && !state.payMethod) { toast("Pilih metode pembayaran.", "warn", "info"); return; }
  const note =($("#orderNote")?.value || "").trim().slice(0, 200);
  const { count, total } = cartTotals();
  const code = "ORD-" + Date.now().toString().slice(-6);
  const meja = OUTLET.meja;

  let orderId = null;
  if (btn) { btn.disabled = true; btn.textContent = "Mengirim..."; }
  try {
    if (typeof db !== "undefined") {
      const ref = await db.collection("orders").add({
        code,
        mejaId: TABLE.id || "",
        mejaName: meja,
        area: OUTLET.area || "",
        items: entries.map(({ m, qty }) => ({ id: String(m.id), name: m.name, price: m.price, qty })),
        count,
        total,
        note,
        status: awal ? "menunggu_bayar" : "baru",
        ...(awal ? { payMethod: state.payMethod, proofs: [] } : {}),
        sessionId: Session.sid() || "",
        fee: Session.fee(total) || {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      orderId = ref.id;
    }
  } catch (e) {
    console.error(e);
    toast(e && e.code === "permission-denied"
      ? "Pesanan ditolak: sesi meja berakhir atau kedai sedang tutup."
      : "Gagal mengirim pesanan. Coba lagi.", "warn", "x");
    if (btn) { btn.disabled = false; btn.innerHTML = "Pesan Sekarang " + icon("arrow-right"); }
    return;
  }
  // Pantau status pesanan ini (toast + notifikasi saat admin memproses / mengantar)
  if (orderId && typeof Live !== "undefined") Live.track(orderId, { code, meja, status: awal ? "menunggu_bayar" : "baru" });
  state.cart = {};
  saveCart();
  orderDone = true;
  renderMenu();
  renderCartBar();
  if (awal && orderId && typeof Pay !== "undefined") {
    Pay.begin({ id: orderId, code, total, method: state.payMethod, meja });
    Pay.open(); // tampilkan kartu pembayaran (QRIS/rekening atau Bayar di Kasir)
    return;
  }
  $("#sheetTitle").textContent = "Pesanan Terkirim";
  $("#sheetBody").innerHTML = `
    <div class="done">
      <div class="done-ic">${icon("check")}</div>
      <h4>Terima kasih!</h4>
      <p>Pesanan Anda sedang disiapkan dan akan diantar ke ${esc(meja)}.</p>
      <span class="code">${code}</span>
    </div>`;
  $("#sheetFoot").innerHTML = `<button class="btn-primary btn-block" id="btnDone">Kembali ke Menu</button>`;
}

/* ---------- Toast ---------- */
let toastTimer;
// type: "ok" | "warn" | "info" (opsional) ; iconName: nama ikon di ICONS (opsional)
function toast(msg, type, iconName) {
  const t = $("#toast");
  t.classList.remove("ok", "warn", "info");
  if (type) t.classList.add(type);
  t.innerHTML = (iconName ? `<span class="toast-ic">${icon(iconName)}</span>` : "") + `<span>${esc(msg)}</span>`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), type ? 3200 : 2000);
}

/* ---------- Events ---------- */
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) {
    state.cat = chip.dataset.cat;
    state.q = "";
    $("#searchInput").value = "";
    renderChips();
    renderMenu();
    return;
  }
  const pm = e.target.closest("[data-pay]");
  if (pm) { state.payMethod = pm.dataset.pay; renderSheet(); hydrateIcons(); return; }
  const act = e.target.closest("[data-act]");
  if (act) {
    const id = act.dataset.id;
    if (act.dataset.act === "inc") changeQty(id, 1);
    if (act.dataset.act === "dec") changeQty(id, -1);
    if (act.dataset.act === "del") { delete state.cart[id]; saveCart(); renderMenu(); renderCartBar(); renderSheet(); }
    return;
  }
  const id = e.target.closest("button")?.id;
  if (id === "btnAll") { state.showAll = !state.showAll; renderMenu(); }
  if (id === "btnOpenCart" || id === "btnCartIcon") openSheet();
  if (id === "btnCloseSheet" || id === "btnDone") closeSheet();
  if (id === "btnOrder") placeOrder();
  if (e.target.closest("[data-close-sheet]")) closeSheet();
  if (e.target.id === "overlay") closeSheet();
});

$("#searchInput").addEventListener("input", (e) => {
  state.q = e.target.value;
  if (state.q) state.cat = "Semua";
  renderChips();
  renderMenu();
});

document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

/* ---------- Data dari Firestore (fallback ke data dummy) ---------- */
const TABLE = { id: "", name: OUTLET.meja, area: OUTLET.area };
const REMOTE = { cfg: {}, table: null, has: false }; // pengaturan outlet + meja hasil scan QR

async function loadRemote() {
  if (typeof db === "undefined") return;
  try {
    const [sSnap, cSnap, mSnap, tSnap] = await Promise.all([
      db.doc("settings/outlet").get(),
      db.collection("categories").get(),
      db.collection("menu").get(),
      db.collection("tables").get()
    ]);
    if (mSnap.empty) return; // belum ada data di Firestore: pakai data dummy

    const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

    if (sSnap.exists) {
      const s = sSnap.data();
      REMOTE.cfg = s;
      ["name", "tagline", "badge", "jamBuka", "sesi", "heroImg"].forEach((k) => { if (s[k]) OUTLET[k] = s[k]; });
      // brandName & logo boleh dikosongkan dari admin (mis. logo sudah memuat nama brand)
      ["brandName", "logo"].forEach((k) => { if (typeof s[k] === "string") OUTLET[k] = s[k]; });
    }

    const items = mSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m) => m.active !== false).sort(byOrder);
    let cats = cSnap.docs.map((d) => d.data()).sort(byOrder).map((c) => c.name);
    if (!cats.length) cats = [...new Set(items.map((m) => m.cat).filter(Boolean))];
    MENU.splice(0, MENU.length, ...items);
    CATEGORIES.splice(0, CATEGORIES.length, "Semua", ...cats);

    const tables = tSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
    if (tables.length) {
      const param = (new URLSearchParams(location.search).get("meja") || "").toLowerCase();
      REMOTE.has = true;
      const t = tables.find((x) => x.id.toLowerCase() === param); // ketat: harus dari QR meja yang valid
      if (t) {
        REMOTE.table = t;
        TABLE.id = t.id;
        OUTLET.meja = t.name;
        OUTLET.area = t.area || OUTLET.area;
      } else {
        OUTLET.meja = "-";
      }
    }

    // Buang item keranjang yang sudah tidak ada di menu
    Object.keys(state.cart).forEach((id) => { if (!findItem(id)) delete state.cart[id]; });
    saveCart();
  } catch (e) {
    console.warn("Memakai data dummy:", e.message);
  }
}

/* ---------- Init ---------- */
async function init() {
  hydrateIcons();
  $("#menuGrid").innerHTML = '<div class="empty">Memuat menu...</div>';
  await Promise.race([loadRemote(), new Promise((r) => setTimeout(r, 5000))]);
  await Session.start(REMOTE.cfg, REMOTE.table, REMOTE.has); // buka / ikut sesi meja
  Session.onChange(onSession);
  renderChips();
  onSession();
}
window.appReady = init(); // live.js menunggu ini sebelum memulai notifikasi & chat