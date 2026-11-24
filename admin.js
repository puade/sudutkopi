/* =========================================
   SudutKopi Admin - admin.js
   Firebase (Auth + Firestore) + Cloudinary
   Koleksi: settings/outlet, categories, menu, tables, orders
   ========================================= */

const auth = firebase.auth();
const TS = () => firebase.firestore.FieldValue.serverTimestamp();

/* ---------- Util ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rupiah = (n) => "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const toDate = (ts) => (ts && ts.toDate ? ts.toDate() : ts ? new Date(ts) : null);
const fmtDT = (d) => (d ? d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-");
const isToday = (d) => !!d && d.toDateString() === new Date().toDateString();
const nextOrder = (arr) => Math.max(0, ...arr.map((x) => x.order || 0)) + 1;
const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "meja";

/* ---------- Ikon ---------- */
const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  logo: '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" fill="#127a50"/><path d="M10 26c6-12 22-14 28-6-8-2-16 0-20 8-3 5-6 4-8-2z" fill="#fff"/><path d="M14 33c8 5 19 3 24-7" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  dashboard: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  receipt: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  coffee: svg('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/>'),
  tag: svg('<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  table: svg('<path d="M6 3v7a2 2 0 0 0 2 2v9"/><path d="M10 3v7a2 2 0 0 1-2 2"/><path d="M8 3v5"/><path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8 0 1.5 1 2 2 2h1.5"/>'),
  sliders: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  logout: svg('<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>'),
  burger: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  upload: svg('<path d="M12 16V5M7 10l5-5 5 5"/><path d="M4 19h16"/>'),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'),
  qr: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M14 21h3M21 17v4h-4M21 14v.5"/>'),
  up: svg('<path d="m6 15 6-6 6 6"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  bell: svg('<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  wallet: svg('<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 7l12-3v3"/><circle cx="16" cy="13.5" r="1.2"/>'),
  db: svg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  chat: svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'),
  send: svg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),
  printer: svg('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
  download: svg('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>'),
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>')
};
const ic = (n) => ICONS[n] || "";
function hydrate(root = document) {
  $$("[data-ic]", root).forEach((el) => { el.innerHTML = ic(el.dataset.ic); });
}

/* ---------- State ---------- */
const S = {
  page: "dashboard",
  settings: null,
  cats: [],
  menu: [],
  tables: [],
  orders: [],
  chats: [],
  chatId: null,
  chatMsgs: [],
  unsubMsgs: null,
  chatsReady: false,
  loaded: {},
  unsubs: [],
  ordersReady: false,
  filterStatus: "semua",
  menuQ: "",
  menuCat: "Semua",
  settingsTouched: false,
  ups: {}
};

const STATUS = {
  baru: { label: "Baru", cls: "st-baru" },
  diproses: { label: "Diproses", cls: "st-proses" },
  siap: { label: "Siap", cls: "st-siap" },
  selesai: { label: "Selesai", cls: "st-selesai" },
  dibatalkan: { label: "Dibatalkan", cls: "st-batal" },
  menunggu_bayar: { label: "Menunggu bayar", cls: "st-baru" },
  verifikasi: { label: "Verifikasi bukti", cls: "st-proses" },
  gagal: { label: "Gagal", cls: "st-batal" },
  kedaluwarsa: { label: "Kedaluwarsa", cls: "st-selesai" }
};
const COUNTED = ["baru", "diproses", "siap", "selesai"]; // status yang dihitung sebagai penjualan (sudah dibayar / masuk dapur)
const PAY_TRANSFER_MS = 15 * 60000, PAY_CASH_MS = 30 * 60000, MAX_PROOF = 3;
const payDeadline = (o) => { const c = toDate(o.createdAt); return c ? c.getTime() + (o.payMethod === "cash" ? PAY_CASH_MS : PAY_TRANSFER_MS) : 0; };
const mmss = (n) => { n = Math.max(0, Math.ceil(n / 1000)); return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); };
const NEXT = { baru: ["diproses", "Proses"], diproses: ["siap", "Tandai siap"], siap: ["selesai", "Selesaikan"] };

function errMsg(e) {
  if (!e) return "Terjadi kesalahan.";
  if (e.code === "permission-denied") return "Akses ditolak. Pastikan email Anda terdaftar sebagai admin di aturan Firestore.";
  if (e.code === "unavailable") return "Tidak ada koneksi ke server.";
  return e.message || "Terjadi kesalahan.";
}

/* ---------- Toast, modal, confirm ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function openModal({ title, body, small, mount }) {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal-bg" data-close-bg>
    <div class="modal ${small ? "sm-modal" : ""}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Tutup">${ic("x")}</button></div>
      <div class="modal-body">${body}</div>
    </div></div>`;
  root.classList.add("show");
  if (mount) mount(root);
  const first = $("input:not([type=hidden]):not([type=checkbox]):not([type=file]),select,textarea", root);
  if (first) first.focus();
}
function closeModal() {
  const r = $("#modalRoot");
  r.classList.remove("show");
  r.innerHTML = "";
}

function confirmBox({ title, text, ok = "Ya", danger = false }) {
  return new Promise((resolve) => {
    const root = $("#confirmRoot");
    root.innerHTML = `<div class="modal-bg"><div class="modal sm-modal" role="alertdialog">
      <div class="modal-head"><h3>${esc(title)}</h3></div>
      <div class="modal-body"><p class="muted" style="line-height:1.55;margin-bottom:18px">${esc(text)}</p>
      <div class="modal-foot"><button class="btn ghost" id="cNo">Batal</button><button class="btn ${danger ? "danger" : "primary"}" id="cYes">${esc(ok)}</button></div></div>
    </div></div>`;
    root.classList.add("show");
    const done = (v) => { root.classList.remove("show"); root.innerHTML = ""; resolve(v); };
    $("#cNo", root).onclick = () => done(false);
    $("#cYes", root).onclick = () => done(true);
  });
}

/* ---------- Cloudinary ---------- */
async function uploadToCloudinary(file, maxW = 800) {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 8 MB.");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json.error && json.error.message) || "Gagal mengunggah gambar.");
  // Optimasi otomatis: format & kualitas terbaik, lebar dibatasi (tanpa memperbesar gambar kecil)
  return json.secure_url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${maxW}/`);
}

// key = awalan id elemen, agar satu halaman bisa punya beberapa uploader (mis. hero + logo)
function imageField(label, hintText = "JPG, PNG, atau WEBP. Maksimal 8 MB.", key = "up", removable = false) {
  return `<div class="field"><label>${esc(label)}</label>
    <div class="uploader">
      <div class="up-prev" id="${key}Prev">${ic("image")}</div>
      <div>
        <div class="up-btns">
          <button type="button" class="btn ghost sm" id="${key}Btn">${ic("upload")}Pilih gambar</button>
          ${removable ? `<button type="button" class="btn ghost sm" id="${key}Del" hidden>${ic("trash")}Hapus</button>` : ""}
        </div>
        <div class="hint" id="${key}Hint" style="margin-top:8px">${esc(hintText)}</div>
      </div>
      <input type="file" id="${key}File" accept="image/*" hidden>
    </div></div>`;
}
function bindUploader(scope, url, maxW, key = "up") {
  const st = { url: url || "", busy: false };
  const prev = $("#" + key + "Prev", scope), btn = $("#" + key + "Btn", scope), file = $("#" + key + "File", scope), hint = $("#" + key + "Hint", scope);
  const del = $("#" + key + "Del", scope);
  const paint = () => {
    prev.style.backgroundImage = st.url ? `url('${st.url}')` : "";
    prev.classList.toggle("has", !!st.url);
    if (del) del.hidden = !st.url;
  };
  paint();
  if (del) del.addEventListener("click", () => { st.url = ""; hint.textContent = "Gambar dihapus. Klik Simpan untuk menerapkan."; paint(); });
  btn.addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const f = file.files[0];
    if (!f) return;
    st.busy = true; btn.disabled = true; hint.textContent = "Mengunggah...";
    try {
      st.url = await uploadToCloudinary(f, maxW);
      hint.textContent = "Gambar berhasil diunggah.";
      paint();
    } catch (e) {
      hint.textContent = e.message || "Gagal mengunggah.";
      toast(e.message || "Gagal mengunggah gambar.");
    } finally {
      st.busy = false; btn.disabled = false; file.value = "";
    }
  });
  return st;
}

const field = (label, input, hint) =>
  `<div class="field"><label>${label}</label>${input}${hint ? `<div class="hint">${hint}</div>` : ""}</div>`;
const emptyBox = (icon, text) => `<div class="empty">${ic(icon)}<div>${esc(text)}</div></div>`;
const hhmm = (d) => (d ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".") : "");

/* ---------- Brand (logo + nama) di sidebar & halaman login ---------- */
function applyBrand() {
  const s = S.settings || {};
  const logo = s.logo ? `<img src="${esc(s.logo)}" alt="">` : ic("logo");
  $$(".brand-logo-slot").forEach((el) => { el.innerHTML = logo; });
  const name = s.brandName || "SudutKopi";
  $$(".brand-name-slot").forEach((el) => { el.textContent = name; });
  document.title = name + " Admin";
}

/* =========================================
   AUTH
   ========================================= */
auth.onAuthStateChanged((user) => {
  $("#splash").classList.add("hidden");
  if (user) {
    $("#loginView").classList.add("hidden");
    $("#shell").classList.remove("hidden");
    $("#who").textContent = user.email;
    startListeners();
    go(S.page);
  } else {
    stopListeners();
    $("#shell").classList.add("hidden");
    $("#loginView").classList.remove("hidden");
  }
});

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn"), err = $("#loginErr");
  err.textContent = "";
  btn.disabled = true; btn.textContent = "Memproses...";
  try {
    await auth.signInWithEmailAndPassword($("#lEmail").value.trim(), $("#lPass").value);
  } catch (ex) {
    const map = {
      "auth/invalid-credential": "Email atau kata sandi salah.",
      "auth/wrong-password": "Email atau kata sandi salah.",
      "auth/user-not-found": "Email atau kata sandi salah.",
      "auth/invalid-email": "Format email tidak valid.",
      "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat.",
      "auth/network-request-failed": "Tidak ada koneksi internet.",
      "auth/operation-not-supported-in-this-environment": "Buka halaman ini lewat http://localhost atau hosting, bukan file langsung."
    };
    err.textContent = map[ex.code] || ex.message;
  } finally {
    btn.disabled = false; btn.textContent = "Masuk";
  }
});

/* =========================================
   REALTIME LISTENERS
   ========================================= */
function stopListeners() {
  S.unsubs.forEach((u) => u());
  S.unsubs = [];
  if (S.unsubMsgs) { S.unsubMsgs(); S.unsubMsgs = null; }
  S.loaded = {};
  S.ordersReady = false;
  S.chatsReady = false;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch (e) { /* diabaikan */ }
}

function startListeners() {
  stopListeners();
  const err = (e) => { console.error(e); toast(errMsg(e)); };
  const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

  S.unsubs.push(db.doc("settings/outlet").onSnapshot((s) => {
    S.settings = s.exists ? s.data() : {};
    S.loaded.settings = true;
    applyBrand();
    renderShopSwitch();
    if (S.page === "settings" && !S.settingsTouched) renderPage();
  }, err));

  // Chat dari pelanggan (ringkasan percakapan, terbaru di atas)
  S.unsubs.push(db.collection("chats").orderBy("lastAt", "desc").limit(100).onSnapshot((snap) => {
    if (S.chatsReady) {
      snap.docChanges().forEach((c) => {
        if (c.type === "removed") return;
        const x = c.doc.data();
        if (x.lastFrom !== "user" || !(x.unreadAdmin > 0)) return;
        beep();
        const viewing = S.page === "chat" && S.chatId === c.doc.id;
        if (!viewing) toast("Pesan baru dari " + (x.mejaName || "pelanggan"));
      });
    }
    S.chats = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
    S.chatsReady = true;
    S.loaded.chats = true;
    refresh();
  }, err));

  S.unsubs.push(db.collection("categories").onSnapshot((snap) => {
    S.cats = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
    S.loaded.cats = true;
    refresh(true);
  }, err));

  S.unsubs.push(db.collection("menu").onSnapshot((snap) => {
    S.menu = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
    S.loaded.menu = true;
    refresh();
  }, err));

  S.unsubs.push(db.collection("tables").onSnapshot((snap) => {
    S.tables = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
    S.loaded.tables = true;
    refresh();
  }, err));

  S.unsubs.push(db.collection("orders").orderBy("createdAt", "desc").limit(200).onSnapshot((snap) => {
    if (S.ordersReady) {
      snap.docChanges().forEach((c) => {
        const o = c.doc.data();
        if (c.type === "added" && o.status === "baru") { beep(); toast("Pesanan baru dari " + (o.mejaName || "pelanggan")); }
        if (c.type === "added" && o.status === "menunggu_bayar" && o.payMethod === "cash") { beep(); toast("Pelanggan akan bayar tunai: " + (o.mejaName || "")); }
        if (c.type === "modified" && o.status === "verifikasi") { beep(); toast("Bukti transfer masuk dari " + (o.mejaName || "pelanggan")); }
      });
    }
    S.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    S.ordersReady = true;
    S.loaded.orders = true;
    refresh();
  }, err));
}

function refresh(full) {
  updateBadge();
  if (S.page === "settings") return;
  if (S.page === "chat") { syncThread(); renderChatList(); return; } // jangan render ulang seluruh halaman (kolom balasan tetap terjaga)
  if (S.page === "menu" && !full && $("#menuList")) { renderMenuList(); return; }
  renderPage();
}
setInterval(() => { // status sesi/jam buka berubah seiring waktu
  renderShopSwitch();
  if (S.page === "tables" || S.page === "dashboard" || (S.page === "orders" && !$("#modalRoot").classList.contains("show"))) renderPage();
}, 30000);
// pesanan yang menunggu tindakan kasir/admin
const needsAction = (o) => o.status === "baru" || o.status === "verifikasi" || (o.status === "menunggu_bayar" && o.payMethod === "cash");
function updateBadge() {
  renderShopSwitch();
  const n = S.orders.filter((o) => needsAction(o)).length;
  const b = $("#badgeOrders");
  b.hidden = n === 0;
  b.textContent = n;
  const cn = S.chats.filter((c) => (c.unreadAdmin || 0) > 0).length;
  const bc = $("#badgeChat");
  bc.hidden = cn === 0;
  bc.textContent = cn;
}

/* =========================================
   NAVIGASI
   ========================================= */
const PAGES = {
  dashboard: { title: "Dashboard", render: pgDashboard },
  orders: { title: "Pesanan", render: pgOrders },
  chat: { title: "Chat Pelanggan", render: pgChat, mount: mountChat },
  menu: { title: "Menu", render: pgMenu, mount: renderMenuList },
  cats: { title: "Kategori", render: pgCats },
  tables: { title: "Meja", render: pgTables },
  settings: { title: "Pengaturan Outlet", render: pgSettings, mount: mountSettings }
};

function go(page) {
  if (!PAGES[page]) page = "dashboard";
  S.page = page;
  S.settingsTouched = false;
  $$(".nav-item[data-page]").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  closeSide();
  renderPage();
  window.scrollTo(0, 0);
}
function renderPage() {
  const p = PAGES[S.page];
  $("#pageTitle").textContent = p.title;
  $("#page").innerHTML = p.render();
  if (p.mount) p.mount();
}
const openSide = () => { $("#side").classList.add("open"); $("#sideBg").classList.add("open"); };
const closeSide = () => { $("#side").classList.remove("open"); $("#sideBg").classList.remove("open"); };

/* =========================================
   DASHBOARD
   ========================================= */
/* =========================================
   SESI MEJA & JAM BUKA (rumus sama dengan firestore.rules & session.js)
   ========================================= */
const GUEST_MS = 15 * 60 * 1000;
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // tampil Senin..Minggu
const DEFAULT_SCHEDULE = () => Array.from({ length: 7 }, () => ({ open: true, from: 480, to: 1320 }));
const mm = (n) => String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
const toMin = (v) => { const m = /^(\d{2}):(\d{2})$/.exec(v || ""); return m ? +m[1] * 60 + +m[2] : NaN; };
const tms = (v) => (v && v.toMillis ? v.toMillis() : 0);
const sessMinutes = () => Number((S.settings || {}).sessionMinutes) || 120;

function sessEnd(t) { // waktu berakhir sesi (ms) atau 0 bila tidak hidup
  if (!t || !t.sessionId) return 0;
  const end = Math.max(tms(t.sessionOpenedAt) ? tms(t.sessionOpenedAt) + GUEST_MS : 0, tms(t.sessionUntil));
  return end > Date.now() ? end : 0;
}

function shopStatus() {
  const c = S.settings || {};
  if (c.acceptOrders === false) return { open: false, text: "Tutup sementara (manual)" };
  if (Array.isArray(c.schedule) && c.schedule.length === 7) {
    const t = Date.now() + (typeof c.tzOffset === "number" ? c.tzOffset : 420) * 60000;
    const wd = (Math.floor(t / 86400000) + 4) % 7, mins = (t % 86400000) / 60000;
    const d = c.schedule[wd];
    if (!(d && d.open === true && mins >= d.from && mins < d.to)) return { open: false, text: "Di luar jam buka" };
  }
  return { open: true, text: "Menerima pesanan" };
}

function renderShopSwitch() {
  const b = $("#shopSwitch");
  if (!b) return;
  const manualOn = (S.settings || {}).acceptOrders !== false;
  const st = shopStatus();
  b.className = "shop-switch " + (st.open ? "on" : "off");
  b.innerHTML = `<span class="sw"><input type="checkbox" tabindex="-1" ${manualOn ? "checked" : ""}><i></i></span><span class="shop-txt"><b>${st.open ? "Buka" : "Tutup"}</b><small>${esc(st.text)}</small></span>`;
  const first = S.tables[0];
  const link = $("#appLink");
  if (link) link.href = "index.html" + (first ? "?meja=" + encodeURIComponent(first.id) : "");
}

function pgDashboard() {
  const valid = S.orders.filter((o) => COUNTED.includes(o.status));
  const today = valid.filter((o) => isToday(toDate(o.createdAt)));
  const revenue = today.reduce((a, o) => a + (o.total || 0), 0);
  const baru = S.orders.filter((o) => o.status === "baru").length;
  const aktif = S.menu.filter((m) => m.active !== false).length;

  const sold = {};
  today.forEach((o) => (o.items || []).forEach((i) => { sold[i.name] = (sold[i.name] || 0) + (i.qty || 0); }));
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMax = top.length ? top[0][1] : 1;

  const needSeed = S.loaded.menu && S.loaded.cats && !S.menu.length;

  return `
    ${needSeed ? `<div class="banner"><div><b>Data masih kosong</b><p>Impor data contoh (outlet, kategori, menu, dan meja) agar bisa langsung dicoba.</p></div>
      <button class="btn primary" data-act="seed">${ic("db")}Impor data dummy</button></div>` : ""}
    <div class="stats">
      <div class="card stat"><div class="stat-ic g">${ic("receipt")}</div><div><small>Pesanan hari ini</small><b>${today.length}</b></div></div>
      <div class="card stat"><div class="stat-ic g">${ic("wallet")}</div><div><small>Pendapatan hari ini</small><b>${rupiah(revenue)}</b></div></div>
      <div class="card stat"><div class="stat-ic o">${ic("bell")}</div><div><small>Pesanan baru</small><b>${baru}</b></div></div>
      <div class="card stat"><div class="stat-ic b">${ic("coffee")}</div><div><small>Menu aktif</small><b>${aktif}<span class="muted sm"> / ${S.menu.length}</span></b></div></div>
      <div class="card stat"><div class="stat-ic g">${ic("table")}</div><div><small>Meja terisi</small><b>${S.tables.filter((t) => sessEnd(t)).length}<span class="muted sm"> / ${S.tables.length}</span></b></div></div>
    </div>
    <div class="dash-cols">
      <div class="card pad">
        <div class="section-title">Pesanan terbaru</div>
        ${S.orders.length ? S.orders.slice(0, 6).map((o) => {
          const st = STATUS[o.status] || STATUS.baru;
          return `<div class="mini-order"><div><b>${esc(o.code || o.id)}</b><div class="muted sm">${esc(o.mejaName || "-")} &middot; ${fmtDT(toDate(o.createdAt))}</div></div>
            <div style="text-align:right"><b>${rupiah(o.total)}</b><div><span class="st ${st.cls}">${st.label}</span></div></div></div>`;
        }).join("") : emptyBox("receipt", "Belum ada pesanan.")}
      </div>
      <div class="card pad">
        <div class="section-title">Menu terlaris hari ini</div>
        ${top.length ? top.map(([n, q]) => `<div class="bar-row"><div class="bar-top"><span>${esc(n)}</span><b>${q}</b></div><div class="bar"><i style="width:${Math.round((q / topMax) * 100)}%"></i></div></div>`).join("")
          : emptyBox("coffee", "Belum ada penjualan hari ini.")}
      </div>
    </div>`;
}

/* =========================================
   PESANAN
   ========================================= */
function orderFeeHTML(o) {
  const f = o.fee || {};
  const calc = (o.items || []).reduce((a, i) => a + (i.price || 0) * (i.qty || 0), 0);
  const warn = calc !== (o.total || 0)
    ? `<div class="order-warn">${ic("info")}Total (${rupiah(o.total)}) tidak sama dengan jumlah harga item (${rupiah(calc)}). Periksa sebelum memproses.</div>` : "";
  const parts = [];
  if (f.service) parts.push(`Layanan ${f.sRate}%: ${rupiah(f.service)}`);
  if (f.tax) parts.push(`Pajak ${f.tRate}%: ${rupiah(f.tax)}`);
  const fee = parts.length ? `<div class="order-fee">Sudah termasuk &middot; ${parts.join(" &middot; ")} &middot; sebelum layanan &amp; pajak: ${rupiah(f.base)}</div>` : "";
  return fee + warn;
}

function orderPayHTML(o) {
  if (!o.payMethod) return "";
  const proofs = (o.proofs || []).map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener" title="${fmtDT(new Date(p.at))}"><img class="proof-img" src="${esc(p.url)}" alt="Bukti transfer"></a>`).join("");
  let line = "";
  if (o.status === "menunggu_bayar") {
    const left = payDeadline(o) - Date.now();
    line = o.payMethod === "cash"
      ? `Menunggu pembayaran tunai di kasir &middot; sisa ${mmss(left)}`
      : `Menunggu bukti transfer &middot; sisa ${mmss(left)}${o.payNote ? ` &middot; ditolak: ${esc(o.payNote)}` : ""}`;
  } else if (o.status === "verifikasi") line = `Bukti transfer ${(o.proofs || []).length}/${MAX_PROOF} menunggu verifikasi`;
  else if (o.status === "gagal") line = `Ditolak: ${esc(o.payNote || "-")}`;
  else if (o.payStatus === "lunas") {
    line = o.payMethod === "cash" && o.cashGiven ? `Tunai diterima ${rupiah(o.cashGiven)} &middot; kembalian ${rupiah(o.change || 0)}` : "Pembayaran lunas";
  }
  const refund = o.refundStatus === "perlu"
    ? `<div class="refund-box"><b>Perlu refund ${rupiah(o.refundAmount || 0)}</b><span>${esc(o.refundNote || "")}</span><button class="btn primary sm" data-act="refund-done" data-id="${o.id}">Tandai sudah direfund</button></div>`
    : o.refundStatus === "selesai" ? `<div class="order-fee">Refund ${rupiah(o.refundAmount || 0)} sudah dikembalikan.</div>` : "";
  return `<div class="order-pay"><span class="tag ${o.payMethod === "cash" ? "o" : ""}">${o.payMethod === "cash" ? "Tunai" : "Transfer"}</span> <span class="muted sm">${line}</span>
    ${proofs ? `<div class="proofs">${proofs}</div>` : ""}</div>${refund}`;
}

function orderCard(o) {
  const st = STATUS[o.status] || STATUS.baru;
  const next = NEXT[o.status];
  const canCancel = ["baru", "diproses", "siap", "menunggu_bayar", "verifikasi"].includes(o.status);
  const payActs = o.status === "verifikasi"
    ? `<button class="btn primary sm" data-act="pay-approve" data-id="${o.id}">Setujui</button><button class="btn ghost sm" data-act="pay-reject" data-id="${o.id}">Tolak</button>`
    : o.status === "menunggu_bayar" && o.payMethod === "cash"
      ? `<button class="btn primary sm" data-act="cash-accept" data-id="${o.id}">Terima tunai</button>` : "";
  return `<article class="card order">
    <div class="order-head">
      <div><b>${esc(o.code || o.id)}</b><div class="muted sm">${esc(o.mejaName || "-")} &middot; ${fmtDT(toDate(o.createdAt))}</div></div>
      <span class="st ${st.cls}">${st.label}</span>
    </div>
    <ul class="order-items">${(o.items || []).map((i) => `<li><span>${i.qty}x ${esc(i.name)}</span><span>${rupiah((i.price || 0) * (i.qty || 0))}</span></li>`).join("")}</ul>
    ${o.note ? `<div class="order-note">Catatan: ${esc(o.note)}</div>` : ""}
    ${orderFeeHTML(o)}
    ${orderPayHTML(o)}
    <div class="order-foot">
      <b>${rupiah(o.total)}</b>
      <div class="actions">
        ${payActs}
        ${next ? `<button class="btn primary sm" data-act="status" data-id="${o.id}" data-to="${next[0]}">${next[1]}</button>` : ""}
        ${canCancel ? `<button class="btn ghost sm" data-act="cancel-order" data-id="${o.id}">Batalkan</button>` : ""}
        <button class="icon-btn danger" data-act="del-order" data-id="${o.id}" aria-label="Hapus">${ic("trash")}</button>
      </div>
    </div>
  </article>`;
}

function pgOrders() {
  const count = (k) => (k === "semua" ? S.orders.length : k === "refund" ? S.orders.filter((o) => o.refundStatus === "perlu").length : S.orders.filter((o) => o.status === k).length);
  const core = ["semua", "baru", "diproses", "siap", "selesai", "dibatalkan"];
  const extra = ["menunggu_bayar", "verifikasi", "gagal", "kedaluwarsa", "refund"].filter((k) => count(k) > 0 || S.filterStatus === k);
  const keys = [...core.slice(0, 2), ...extra.filter((k) => k === "menunggu_bayar" || k === "verifikasi"), ...core.slice(2), ...extra.filter((k) => k === "gagal" || k === "kedaluwarsa"), ...extra.filter((k) => k === "refund")];
  const label = (k) => (k === "semua" ? "Semua" : k === "refund" ? "Perlu refund" : STATUS[k].label);
  const list = S.filterStatus === "semua" ? S.orders
    : S.filterStatus === "refund" ? S.orders.filter((o) => o.refundStatus === "perlu")
    : S.orders.filter((o) => o.status === S.filterStatus);
  return `<div class="pills">${keys.map((k) =>
    `<button class="pill ${S.filterStatus === k ? "active" : ""}" data-act="filter-status" data-key="${k}">${label(k)}<em>${count(k)}</em></button>`).join("")}</div>
    ${list.length ? `<div class="orders">${list.map(orderCard).join("")}</div>` : `<div class="card">${emptyBox("receipt", "Tidak ada pesanan.")}</div>`}`;
}

/* =========================================
   MENU
   ========================================= */
function pgMenu() {
  return `<div class="toolbar">
    <div class="search grow">${ic("search")}<input id="menuSearch" type="search" placeholder="Cari menu..." value="${esc(S.menuQ)}"></div>
    <select class="select" id="menuCatSel">
      <option value="Semua">Semua kategori</option>
      ${S.cats.map((c) => `<option value="${esc(c.name)}" ${S.menuCat === c.name ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
    </select>
    <div class="tb-actions"><button class="btn primary" data-act="new-menu">${ic("plus")}Tambah menu</button></div>
  </div>
  <div class="muted sm" id="menuCount" style="margin-bottom:10px"></div>
  <div class="mlist" id="menuList"></div>`;
}

function menuFiltered() {
  const q = S.menuQ.trim().toLowerCase();
  return S.menu.filter((m) =>
    (S.menuCat === "Semua" || m.cat === S.menuCat) &&
    (!q || ((m.name || "") + " " + (m.desc || "")).toLowerCase().includes(q)));
}

function menuRow(m) {
  return `<div class="mrow ${m.active === false ? "off" : ""}">
    <div class="thumb" style="background-image:url('${esc(m.img || "")}')">${m.img ? "" : ic("image")}</div>
    <div class="mrow-main">
      <b>${esc(m.name)}</b>
      <div class="muted sm">${esc(m.cat || "-")} &middot; ${rupiah(m.price)}</div>
      <div class="tags">${m.best ? '<span class="tag o">Best seller</span>' : ""}${m.layout === "row" ? '<span class="tag">Baris lebar</span>' : ""}</div>
    </div>
    <div class="mrow-tog">
      <label class="tog"><span class="sw"><input type="checkbox" data-act="toggle" data-field="active" data-id="${m.id}" ${m.active !== false ? "checked" : ""}><i></i></span>Aktif</label>
      <label class="tog"><span class="sw"><input type="checkbox" data-act="toggle" data-field="fav" data-id="${m.id}" ${m.fav ? "checked" : ""}><i></i></span>Favorit</label>
    </div>
    <div class="mrow-act">
      <button class="icon-btn" data-act="edit-menu" data-id="${m.id}" aria-label="Edit">${ic("edit")}</button>
      <button class="icon-btn danger" data-act="del-menu" data-id="${m.id}" aria-label="Hapus">${ic("trash")}</button>
    </div>
  </div>`;
}

function renderMenuList() {
  const el = $("#menuList");
  if (!el) return;
  const list = menuFiltered();
  $("#menuCount").textContent = `${list.length} dari ${S.menu.length} menu`;
  el.innerHTML = list.length ? list.map(menuRow).join("") : `<div class="card">${emptyBox("coffee", S.menu.length ? "Menu tidak ditemukan." : "Belum ada menu. Klik Tambah menu untuk memulai.")}</div>`;
}

function openMenuForm(id) {
  if (!S.cats.length) { toast("Buat kategori terlebih dulu."); go("cats"); return; }
  const m = id ? S.menu.find((x) => x.id === id) : null;
  const v = m || { name: "", cat: S.cats[0].name, price: "", desc: "", img: "", fav: false, best: false, active: true, layout: "card" };
  openModal({
    title: m ? "Edit Menu" : "Tambah Menu",
    body: `<form id="mForm">
      ${field("Nama menu", `<input name="name" required maxlength="60" value="${esc(v.name)}" placeholder="Contoh: Kopi Susu Gula Aren">`)}
      <div class="grid2">
        ${field("Kategori", `<select name="cat">${S.cats.map((c) => `<option value="${esc(c.name)}" ${v.cat === c.name ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>`)}
        ${field("Harga (Rp)", `<input name="price" type="number" min="0" step="500" required value="${esc(v.price)}" placeholder="22000">`)}
      </div>
      ${field("Deskripsi", `<textarea name="desc" maxlength="140" placeholder="Deskripsi singkat menu">${esc(v.desc)}</textarea>`)}
      ${imageField("Gambar menu")}
      ${field("Tampilan kartu", `<select name="layout"><option value="card" ${v.layout !== "row" ? "selected" : ""}>Kartu (2 kolom)</option><option value="row" ${v.layout === "row" ? "selected" : ""}>Baris lebar (cocok untuk makanan)</option></select>`)}
      <div class="checks">
        <label class="check"><span class="sw"><input type="checkbox" name="active" ${v.active !== false ? "checked" : ""}><i></i></span>Aktif (tampil di aplikasi)</label>
        <label class="check"><span class="sw"><input type="checkbox" name="fav" ${v.fav ? "checked" : ""}><i></i></span>Menu favorit</label>
        <label class="check"><span class="sw"><input type="checkbox" name="best" ${v.best ? "checked" : ""}><i></i></span>Label Best Seller</label>
      </div>
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn primary" type="submit">Simpan</button></div>
    </form>`,
    mount(root) {
      const up = bindUploader(root, v.img, 800);
      $("#mForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        if (up.busy) { toast("Tunggu unggahan gambar selesai."); return; }
        const fd = new FormData(e.target);
        const data = {
          name: fd.get("name").trim(),
          cat: fd.get("cat"),
          price: Math.max(0, parseInt(fd.get("price"), 10) || 0),
          desc: (fd.get("desc") || "").trim(),
          img: up.url,
          layout: fd.get("layout"),
          active: fd.has("active"),
          fav: fd.has("fav"),
          best: fd.has("best"),
          updatedAt: TS()
        };
        const btn = $("button[type=submit]", e.target);
        btn.disabled = true;
        try {
          if (m) await db.collection("menu").doc(m.id).update(data);
          else { data.order = nextOrder(S.menu); data.createdAt = TS(); await db.collection("menu").add(data); }
          toast("Menu disimpan.");
          closeModal();
        } catch (ex) { toast(errMsg(ex)); btn.disabled = false; }
      });
    }
  });
}

/* =========================================
   KATEGORI
   ========================================= */
function pgCats() {
  return `<div class="toolbar"><div class="muted">${S.cats.length} kategori</div>
    <div class="tb-actions"><button class="btn primary" data-act="new-cat">${ic("plus")}Tambah kategori</button></div></div>
    ${S.cats.length ? S.cats.map((c, i) => {
      const n = S.menu.filter((m) => m.cat === c.name).length;
      return `<div class="crow">
        <div style="display:flex;flex-direction:column">
          <button class="icon-btn" style="height:22px" data-act="move-cat" data-id="${c.id}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Naik">${ic("up")}</button>
          <button class="icon-btn" style="height:22px" data-act="move-cat" data-id="${c.id}" data-dir="1" ${i === S.cats.length - 1 ? "disabled" : ""} aria-label="Turun">${ic("down")}</button>
        </div>
        <b>${esc(c.name)}</b><span class="count">${n} menu</span>
        <button class="icon-btn" data-act="edit-cat" data-id="${c.id}" aria-label="Edit">${ic("edit")}</button>
        <button class="icon-btn danger" data-act="del-cat" data-id="${c.id}" aria-label="Hapus">${ic("trash")}</button>
      </div>`;
    }).join("") : `<div class="card">${emptyBox("tag", "Belum ada kategori.")}</div>`}`;
}

function openCatForm(id) {
  const c = id ? S.cats.find((x) => x.id === id) : null;
  openModal({
    title: c ? "Edit Kategori" : "Tambah Kategori", small: true,
    body: `<form id="cForm">
      ${field("Nama kategori", `<input name="name" required maxlength="30" value="${esc(c ? c.name : "")}" placeholder="Contoh: Kopi">`)}
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn primary" type="submit">Simpan</button></div>
    </form>`,
    mount(root) {
      $("#cForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = new FormData(e.target).get("name").trim();
        if (!name) return;
        if (name.toLowerCase() === "semua") { toast('Nama "Semua" sudah dipakai sistem.'); return; }
        if (S.cats.some((x) => x.id !== (c && c.id) && x.name.toLowerCase() === name.toLowerCase())) { toast("Nama kategori sudah ada."); return; }
        const btn = $("button[type=submit]", e.target); btn.disabled = true;
        try {
          if (c) {
            const batch = db.batch();
            batch.update(db.collection("categories").doc(c.id), { name });
            if (c.name !== name) S.menu.filter((m) => m.cat === c.name).forEach((m) => batch.update(db.collection("menu").doc(m.id), { cat: name }));
            await batch.commit();
            if (S.menuCat === c.name) S.menuCat = name;
          } else {
            await db.collection("categories").add({ name, order: nextOrder(S.cats) });
          }
          toast("Kategori disimpan.");
          closeModal();
        } catch (ex) { toast(errMsg(ex)); btn.disabled = false; }
      });
    }
  });
}

async function moveCat(id, dir) {
  const list = [...S.cats];
  const i = list.findIndex((c) => c.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const batch = db.batch();
  list.forEach((c, idx) => batch.update(db.collection("categories").doc(c.id), { order: idx + 1 }));
  try { await batch.commit(); } catch (e) { toast(errMsg(e)); }
}

/* =========================================
   MEJA
   ========================================= */
// Alamat aplikasi pelanggan: dari Pengaturan (Alamat aplikasi pelanggan) bila diisi, jika tidak: index.html di folder yang sama
function tableUrl(id) {
  const custom = ((S.settings && S.settings.appUrl) || "").trim();
  let u;
  try { u = custom ? new URL(custom) : new URL("index.html", location.href); }
  catch (e) { u = new URL("index.html", location.href); }
  u.searchParams.set("meja", id);
  u.hash = "";
  return u.href;
}
const isLocalUrl = (href) => {
  try {
    const u = new URL(href);
    return u.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(u.hostname);
  } catch (e) { return false; }
};
const LOCAL_WARN = `<div class="notice">Alamat QR masih <b>localhost</b>, sehingga tidak bisa dibuka dari HP pelanggan. Isi <b>Alamat aplikasi pelanggan</b> di menu Pengaturan (mis. https://namaanda.web.app) sebelum mencetak.</div>`;

/* ---------- QR (dibuat di browser dengan qrcode.js, tanpa layanan luar) ---------- */
function qrMake(text) {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  return q;
}
function qrSvg(text, margin = 2) {
  const q = qrMake(text), n = q.getModuleCount(), t = n + margin * 2;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (q.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
function qrPng(text, px = 1024, margin = 2) {
  const q = qrMake(text), n = q.getModuleCount(), t = n + margin * 2, cell = Math.max(1, Math.floor(px / t));
  const cv = document.createElement("canvas");
  cv.width = cv.height = cell * t;
  const g = cv.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#000";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (q.isDark(r, c)) g.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
    }
  }
  return cv.toDataURL("image/png");
}

function pgTables() {
  return `<div class="toolbar"><div class="muted">${S.tables.length} meja</div>
    <div class="tb-actions">
      <button class="btn ghost" data-act="print-tables" ${S.tables.length ? "" : "disabled"}>${ic("printer")}Cetak QR</button>
      <button class="btn ghost" data-act="bulk-table">${ic("plus")}Tambah banyak</button>
      <button class="btn primary" data-act="new-table">${ic("plus")}Tambah meja</button>
    </div></div>
    ${S.tables.length ? `<div class="tgrid">${S.tables.map((t) => `<div class="card tcard">
      <div class="t-ic">${ic("table")}</div><b>${esc(t.name)}</b><span class="chip-area">${esc(t.area || "-")}</span>
      ${(() => { const e = sessEnd(t); return e
        ? `<span class="t-state busy">Terisi &middot; s/d ${hhmm(new Date(e))}</span><button class="btn ghost sm" data-act="clear-table" data-id="${t.id}">Kosongkan meja</button>`
        : `<span class="t-state free">Kosong</span>`; })()}
      <div class="t-act">
        <button class="icon-btn" data-act="qr-table" data-id="${t.id}" aria-label="Lihat QR">${ic("qr")}</button>
        <button class="icon-btn" data-act="print-table" data-id="${t.id}" aria-label="Cetak QR">${ic("printer")}</button>
        <button class="icon-btn" data-act="copy-table" data-id="${t.id}" aria-label="Salin tautan">${ic("copy")}</button>
        <button class="icon-btn" data-act="edit-table" data-id="${t.id}" aria-label="Edit">${ic("edit")}</button>
        <button class="icon-btn danger" data-act="del-table" data-id="${t.id}" aria-label="Hapus">${ic("trash")}</button>
      </div></div>`).join("")}</div>` : `<div class="card">${emptyBox("table", "Belum ada meja.")}</div>`}`;
}

const AREA_LIST = `<datalist id="areaList"><option>Indoor</option><option>Outdoor</option><option>VIP</option><option>Smoking</option><option>Lantai 2</option></datalist>`;

function uniqueTableId(name) {
  let id = slug(name);
  if (S.tables.some((t) => t.id === id)) id += "-" + Math.random().toString(36).slice(2, 5);
  return id;
}

function openTableForm(id) {
  const t = id ? S.tables.find((x) => x.id === id) : null;
  openModal({
    title: t ? "Edit Meja" : "Tambah Meja", small: true,
    body: `<form id="tForm">
      ${field("Nama meja", `<input name="name" required maxlength="30" value="${esc(t ? t.name : "")}" placeholder="Contoh: Meja 11">`)}
      ${field("Area", `<input name="area" list="areaList" maxlength="30" value="${esc(t ? t.area : "Indoor")}">${AREA_LIST}`)}
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn primary" type="submit">Simpan</button></div>
    </form>`,
    mount(root) {
      $("#tForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = { name: fd.get("name").trim(), area: fd.get("area").trim() };
        const btn = $("button[type=submit]", e.target); btn.disabled = true;
        try {
          if (t) await db.collection("tables").doc(t.id).update(data);
          else await db.collection("tables").doc(uniqueTableId(data.name)).set({ ...data, order: nextOrder(S.tables) });
          toast("Meja disimpan.");
          closeModal();
        } catch (ex) { toast(errMsg(ex)); btn.disabled = false; }
      });
    }
  });
}

function openBulkTable() {
  openModal({
    title: "Tambah Banyak Meja", small: true,
    body: `<form id="bForm">
      <div class="grid2">
        ${field("Awalan nama", `<input name="prefix" required value="Meja" maxlength="20">`)}
        ${field("Mulai dari nomor", `<input name="start" type="number" min="1" value="${S.tables.length + 1}" required>`)}
      </div>
      <div class="grid2">
        ${field("Jumlah meja", `<input name="count" type="number" min="1" max="60" value="5" required>`)}
        ${field("Area", `<input name="area" list="areaList" value="Indoor">${AREA_LIST}`)}
      </div>
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn primary" type="submit">Buat meja</button></div>
    </form>`,
    mount(root) {
      $("#bForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const prefix = fd.get("prefix").trim(), start = parseInt(fd.get("start"), 10) || 1;
        const count = Math.min(60, parseInt(fd.get("count"), 10) || 1), area = fd.get("area").trim();
        const btn = $("button[type=submit]", e.target); btn.disabled = true;
        try {
          const batch = db.batch();
          let ord = nextOrder(S.tables);
          const used = new Set(S.tables.map((t) => t.id));
          for (let i = 0; i < count; i++) {
            const name = `${prefix} ${String(start + i).padStart(2, "0")}`;
            let tid = slug(name);
            if (used.has(tid)) tid += "-" + Math.random().toString(36).slice(2, 5);
            used.add(tid);
            batch.set(db.collection("tables").doc(tid), { name, area, order: ord++ });
          }
          await batch.commit();
          toast(count + " meja dibuat.");
          closeModal();
        } catch (ex) { toast(errMsg(ex)); btn.disabled = false; }
      });
    }
  });
}

function openQr(id) {
  const t = S.tables.find((x) => x.id === id);
  if (!t) return;
  const url = tableUrl(t.id);
  openModal({
    title: "QR " + t.name, small: true,
    body: `<div class="qr-box">${qrSvg(url)}</div>
      <div class="linkbox">${esc(url)}</div>
      ${isLocalUrl(url) ? LOCAL_WARN : ""}
      <div class="modal-foot wrap">
        <button class="btn ghost" data-act="dl-qr" data-id="${t.id}">${ic("download")}Unduh PNG</button>
        <button class="btn ghost" data-act="print-table" data-id="${t.id}">${ic("printer")}Cetak</button>
        <button class="btn primary" data-act="copy-table" data-id="${t.id}">${ic("copy")}Salin tautan</button>
      </div>`
  });
}

function downloadQr(id) {
  const t = S.tables.find((x) => x.id === id);
  if (!t) return;
  const a = document.createElement("a");
  a.href = qrPng(tableUrl(t.id));
  a.download = "qr-" + slug(t.name) + ".png";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- Cetak QR (satu meja atau massal) ---------- */
// Ukuran dalam mm / pt untuk kertas A4 portrait (area cetak 190 x 275 mm)
const PRINT_LAYOUTS = {
  "1": { cols: 1, rows: 1, qr: 140, logo: 22, brand: 30, prompt: 22, name: 44, area: 18, label: "1 per halaman (besar)" },
  "2": { cols: 1, rows: 2, qr: 70, logo: 14, brand: 20, prompt: 15, name: 28, area: 12, label: "2 per halaman" },
  "4": { cols: 2, rows: 2, qr: 68, logo: 11, brand: 15, prompt: 12, name: 22, area: 10, label: "4 per halaman (disarankan)" },
  "6": { cols: 2, rows: 3, qr: 44, logo: 8, brand: 12, prompt: 10, name: 17, area: 8.5, label: "6 per halaman (kecil)" }
};

function buildPrintHtml(list, opt) {
  const s = S.settings || {};
  const L = PRINT_LAYOUTS[opt.layout] || PRINT_LAYOUTS["4"];
  const per = L.cols * L.rows;
  const brandName = s.brandName || s.name || "";
  const logo = opt.logo && s.logo ? s.logo : "";
  const card = (t) => `<div class="card">
    <div class="brand">${logo ? `<img src="${esc(logo)}" alt="">` : `<b>${esc(brandName)}</b>`}</div>
    <div class="prompt">${esc(opt.text)}</div>
    <div class="qr">${qrSvg(tableUrl(t.id))}</div>
    <div class="name">${esc(t.name)}</div>
    ${t.area ? `<div class="area">${esc(t.area)}</div>` : ""}
  </div>`;
  let pages = "";
  for (let i = 0; i < list.length; i += per) {
    pages += `<div class="page">${list.slice(i, i + per).map(card).join("")}</div>`;
  }
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>QR Meja</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>
@page{size:A4 portrait;margin:10mm}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;color:#14274e;font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:190mm;height:274mm;display:grid;grid-template-columns:repeat(${L.cols},1fr);grid-template-rows:repeat(${L.rows},1fr);gap:4mm;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.card{border:.35mm dashed #b9b2a8;border-radius:4mm;padding:4mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.8mm;text-align:center;overflow:hidden;break-inside:avoid}
.brand{min-height:${L.logo}mm;display:flex;align-items:center;justify-content:center;max-width:100%}
.brand img{height:${L.logo}mm;width:auto;max-width:100%;object-fit:contain;display:block}
.brand b{font-size:${L.brand}pt;font-weight:800;letter-spacing:-.2px}
.prompt{font-size:${L.prompt}pt;font-weight:600;color:#5f6b80}
.qr{width:${L.qr}mm;height:${L.qr}mm}
.qr svg{width:100%;height:100%;display:block}
.name{font-size:${L.name}pt;font-weight:800;line-height:1.1}
.area{font-size:${L.area}pt;font-weight:600;color:#127a50;background:#e4f3ec;padding:.6mm 3mm;border-radius:99px}
</style></head><body>${pages}</body></html>`;
}

function printQr(ids, opt) {
  const list = S.tables.filter((t) => ids.includes(t.id));
  if (!list.length) { toast("Pilih minimal satu meja."); return; }
  const html = buildPrintHtml(list, opt);
  const ifr = document.createElement("iframe");
  ifr.setAttribute("aria-hidden", "true");
  ifr.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
  const cleanup = () => setTimeout(() => ifr.remove(), 1000);
  ifr.onload = async () => {
    const w = ifr.contentWindow, d = ifr.contentDocument;
    try {
      const imgs = [...d.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })));
      await Promise.race([Promise.all([d.fonts ? d.fonts.ready : 0, ...imgs]), new Promise((r) => setTimeout(r, 2500))]);
      w.onafterprint = cleanup;
      setTimeout(() => ifr.remove(), 120000); // jaga-jaga
      w.focus();
      w.print();
    } catch (e) {
      toast("Tidak bisa membuka dialog cetak.");
      ifr.remove();
    }
  };
  ifr.srcdoc = html;
  document.body.appendChild(ifr);
}

function openPrint(preIds) {
  if (!S.tables.length) { toast("Belum ada meja."); return; }
  const sel = new Set(preIds && preIds.length ? preIds : S.tables.map((t) => t.id));
  const s = S.settings || {};
  const hasLogo = !!s.logo;
  const local = isLocalUrl(tableUrl(S.tables[0].id));
  openModal({
    title: "Cetak QR Meja",
    body: `<form id="pForm">
      ${local ? LOCAL_WARN : ""}
      <div class="field">
        <div class="pick-head"><label class="check"><input type="checkbox" id="pAll"> Pilih semua meja</label><span class="hint" id="pCount"></span></div>
        <div class="pick" id="pPick">${S.tables.map((t) => `<label class="pick-item"><input type="checkbox" name="t" value="${esc(t.id)}" ${sel.has(t.id) ? "checked" : ""}><span>${esc(t.name)}</span><em>${esc(t.area || "")}</em></label>`).join("")}</div>
      </div>
      <div class="grid2">
        ${field("Tata letak (kertas A4)", `<select name="layout">${Object.entries(PRINT_LAYOUTS).map(([k, v]) => `<option value="${k}" ${k === "4" ? "selected" : ""}>${v.label}</option>`).join("")}</select>`)}
        ${field("Teks di atas QR", `<input name="text" maxlength="40" value="Scan untuk memesan">`)}
      </div>
      ${hasLogo ? `<div class="checks"><label class="check"><span class="sw"><input type="checkbox" name="logo" checked><i></i></span>Tampilkan logo brand</label></div>` : ""}
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn primary" type="submit" id="pGo">${ic("printer")}Cetak</button></div>
    </form>`,
    mount(root) {
      const boxes = () => $$('input[name="t"]', root);
      const sync = () => {
        const n = boxes().filter((b) => b.checked).length;
        $("#pCount", root).textContent = `${n} dipilih`;
        $("#pAll", root).checked = n === boxes().length;
        $("#pGo", root).disabled = n === 0;
      };
      $("#pAll", root).addEventListener("change", (e) => { boxes().forEach((b) => { b.checked = e.target.checked; }); sync(); });
      $("#pPick", root).addEventListener("change", sync);
      sync();
      $("#pForm", root).addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const ids = boxes().filter((b) => b.checked).map((b) => b.value);
        printQr(ids, { layout: fd.get("layout"), text: (fd.get("text") || "").trim(), logo: fd.has("logo") });
        closeModal();
      });
    }
  });
}

/* =========================================
   PENGATURAN
   ========================================= */
function pgSettings() {
  const s = S.settings || {};
  return `<form id="setForm" class="card pad">
      <div class="grid2">
        ${field("Nama outlet", `<input name="name" required maxlength="40" value="${esc(s.name || "")}" placeholder="Kopi Senja">`)}
        ${field("Badge", `<input name="badge" maxlength="30" value="${esc(s.badge || "")}" placeholder="Demo POS Basic">`, "Label kecil hijau di atas nama outlet")}
      </div>
      ${field("Tagline", `<input name="tagline" maxlength="100" value="${esc(s.tagline || "")}" placeholder="Nikmati kopi terbaik untuk menemani harimu">`)}
      <div class="section-sep">
        <div class="section-title">Jam buka &amp; sesi meja</div>
        <p class="muted sm" style="margin:-4px 0 12px;line-height:1.5">Di luar jam buka, pelanggan hanya bisa melihat menu. Saklar Buka/Tutup di bagian atas halaman menutup pemesanan secara manual.</p>
        ${scheduleHTML(s)}
        <div class="grid2">
          ${field("Zona waktu", `<select name="tzOffset"><option value="420" ${(s.tzOffset ?? 420) === 420 ? "selected" : ""}>WIB (UTC+7)</option><option value="480" ${s.tzOffset === 480 ? "selected" : ""}>WITA (UTC+8)</option><option value="540" ${s.tzOffset === 540 ? "selected" : ""}>WIT (UTC+9)</option></select>`)}
          ${field("Durasi sesi setelah pesanan diproses (menit)", `<input name="sessionMinutes" type="number" min="15" max="720" step="5" value="${s.sessionMinutes ?? 120}">`, "Pelanggan punya 15 menit untuk memesan pertama kali setelah scan QR. Setelah pesanan diproses, sesi diperpanjang selama durasi ini.")}
        </div>
      </div>
      <div class="section-sep">
        <div class="section-title">Pembayaran</div>
        <p class="muted sm" style="margin:-4px 0 12px;line-height:1.5">Satu mode untuk semua meja. Pada mode "bayar di awal", pesanan baru masuk ke dapur setelah pembayaran diterima.</p>
        ${field("Mode pembayaran", `<select name="payMode"><option value="akhir" ${s.payMode !== "awal" ? "selected" : ""}>Langsung ke dapur (tanpa bayar di aplikasi)</option><option value="awal" ${s.payMode === "awal" ? "selected" : ""}>Bayar di awal (Transfer / Tunai)</option></select>`)}
        <div class="field"><label>Metode yang tersedia</label>
          <label class="tog"><span class="sw"><input type="checkbox" name="payTransfer" ${s.payTransfer !== false ? "checked" : ""}><i></i></span>Transfer (QRIS / rekening)</label>
          <label class="tog" style="margin-top:8px"><span class="sw"><input type="checkbox" name="payCash" ${s.payCash !== false ? "checked" : ""}><i></i></span>Tunai di kasir</label>
        </div>
        ${imageField("Gambar QRIS kedai", "Foto/gambar QRIS statis. Tampil di kartu pembayaran pelanggan.", "qris", true)}
        <div class="grid2">
          ${field("Nama bank / e-wallet", `<input name="bankName" maxlength="30" value="${esc(s.bankName || "")}" placeholder="BCA">`)}
          ${field("Nomor rekening", `<input name="accNo" maxlength="30" inputmode="numeric" value="${esc(s.accNo || "")}" placeholder="1234567890">`)}
        </div>
        ${field("Atas nama", `<input name="accName" maxlength="40" value="${esc(s.accName || "")}" placeholder="Nama pemilik rekening">`)}
      </div>
      <div class="section-sep">
        <div class="section-title">Pajak &amp; biaya layanan</div>
        <p class="muted sm" style="margin:-4px 0 12px;line-height:1.5">Harga menu dianggap SUDAH termasuk pajak dan layanan. Angka ini hanya dipakai untuk menampilkan rincian, tidak menambah total. Isi 0 untuk menyembunyikan.</p>
        <div class="grid2">
          ${field("Biaya layanan (%)", `<input name="serviceRate" type="number" min="0" max="30" step="0.5" value="${s.serviceRate ?? 0}">`)}
          ${field("Pajak (%)", `<input name="taxRate" type="number" min="0" max="30" step="0.5" value="${s.taxRate ?? 0}">`)}
        </div>
      </div>
      ${imageField("Gambar hero (header aplikasi)", "Disarankan gambar landscape. Maksimal 8 MB.", "hero")}
      <div class="section-sep">
        <div class="section-title">Brand &amp; QR</div>
        ${field("Nama brand (header)", `<input name="brandName" maxlength="40" value="${esc(s.brandName ?? "")}" placeholder="Sudut Kopi">`, "Teks di pojok kiri atas aplikasi. Kosongkan jika logo sudah memuat nama brand.")}
        ${imageField("Logo brand", "PNG transparan disarankan. Tampil di header aplikasi, panel admin, dan cetak QR.", "logo", true)}
        ${field("Alamat aplikasi pelanggan (untuk QR)", `<input name="appUrl" type="url" maxlength="200" value="${esc(s.appUrl || "")}" placeholder="https://namaanda.web.app/index.html">`, "Alamat tempat index.html di-hosting. QR meja akan mengarah ke alamat ini ditambah ?meja=...")}
      </div>
      <div class="form-actions"><button class="btn primary" type="submit">Simpan pengaturan</button></div>
    </form>
    <div class="card pad mt">
      <div class="section-title">Data contoh</div>
      <p class="muted" style="margin-bottom:14px;line-height:1.55">Tambahkan pengaturan outlet, kategori, menu, dan 10 meja contoh ke Firestore. Cocok untuk uji coba awal.</p>
      <button class="btn ghost" data-act="seed">${ic("db")}Impor data dummy</button>
    </div>`;
}
function scheduleHTML(s) {
  const sch = Array.isArray(s.schedule) && s.schedule.length === 7 ? s.schedule : DEFAULT_SCHEDULE();
  return `<div class="sched">${DAY_ORDER.map((i) => {
    const d = sch[i];
    return `<div class="sched-row"><label class="tog"><span class="sw"><input type="checkbox" name="d${i}_open" ${d.open ? "checked" : ""}><i></i></span><b>${DAY_NAMES[i]}</b></label>
      <input type="time" name="d${i}_from" value="${mm(d.from)}"><span class="muted">sampai</span><input type="time" name="d${i}_to" value="${mm(d.to)}"></div>`;
  }).join("")}</div>`;
}
function mountSettings() {
  const s = S.settings || {};
  S.ups = {
    hero: bindUploader($("#page"), s.heroImg, 1200, "hero"),
    logo: bindUploader($("#page"), s.logo, 400, "logo"),
    qris: bindUploader($("#page"), s.qrisUrl, 900, "qris")
  };
}

/* =========================================
   CHAT PELANGGAN
   chats/{chatId} (ringkasan) + chats/{chatId}/messages (isi)
   ========================================= */
function pgChat() {
  return `<div class="chat-wrap ${S.chatId ? "in-thread" : ""}" id="chatWrap">
    <div class="card chat-list" id="chatList"></div>
    <div class="card thread" id="chatThread"></div>
  </div>`;
}
function mountChat() {
  renderChatList();
  renderThread();
}

function chatAvatar(c) {
  const digits = String(c.mejaName || "").replace(/\D+/g, "");
  return esc(digits || String(c.mejaName || "?").charAt(0).toUpperCase());
}

function renderChatList() {
  const el = $("#chatList");
  if (!el) return;
  if (!S.chats.length) { el.innerHTML = emptyBox("chat", "Belum ada percakapan."); return; }
  el.innerHTML = S.chats.map((c) => {
    const un = c.unreadAdmin || 0;
    return `<button class="cl-item ${c.id === S.chatId ? "active" : ""}" data-act="open-chat" data-id="${c.id}">
      <span class="cl-ava">${chatAvatar(c)}</span>
      <span class="cl-main"><b>${esc(c.mejaName || "Pelanggan")}</b><span class="cl-last">${c.lastFrom === "admin" ? "Anda: " : ""}${esc(c.lastMessage || "")}</span></span>
      <span class="cl-meta"><small>${hhmm(toDate(c.lastAt))}</small>${un ? `<i class="cl-badge">${un}</i>` : ""}</span>
    </button>`;
  }).join("");
  // sedang membuka percakapan ini -> otomatis dianggap terbaca
  const cur = S.chats.find((c) => c.id === S.chatId);
  if (S.page === "chat" && cur && (cur.unreadAdmin || 0) > 0) markChatRead(cur.id);
}

function renderThread() {
  const el = $("#chatThread");
  if (!el) return;
  const c = S.chats.find((x) => x.id === S.chatId);
  if (!c) {
    el.innerHTML = `<div class="thread-empty">${ic("chat")}<div>Pilih percakapan di sebelah kiri.</div></div>`;
    return;
  }
  el.innerHTML = `<div class="thread-head">
      <button class="icon-btn back" data-act="close-chat" aria-label="Kembali">${ic("back")}</button>
      <div><b>${esc(c.mejaName || "Pelanggan")}</b><div class="muted sm">${esc(c.area || "")}</div></div>
      <button class="icon-btn danger" style="margin-left:auto" data-act="del-chat" data-id="${c.id}" aria-label="Hapus percakapan">${ic("trash")}</button>
    </div>
    <div class="thread-msgs" id="chatMsgs"></div>
    <form class="thread-input" id="chatReply">
      <textarea id="replyText" rows="1" maxlength="500" placeholder="Tulis balasan... (Enter untuk kirim, Shift+Enter baris baru)"></textarea>
      <button class="btn primary" type="submit">${ic("send")}Kirim</button>
    </form>`;
  renderMsgs(true);
}

function renderMsgs(force) {
  const el = $("#chatMsgs");
  if (!el) return;
  const stick = force || el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  el.innerHTML = S.chatMsgs.length
    ? S.chatMsgs.map((m) => `<div class="b ${m.from === "admin" ? "admin" : "user"}">${m.image ? `<a href="${esc(m.image)}" target="_blank" rel="noopener"><img class="b-img" src="${esc(m.image)}" alt="Gambar"></a>` : ""}${esc(m.text)}<small>${hhmm(toDate(m.createdAt))}</small></div>`).join("")
    : `<div class="thread-empty">Belum ada pesan.</div>`;
  if (stick) el.scrollTop = el.scrollHeight;
}

// Menjaga kolom percakapan tetap sinkron saat daftar chat berubah
function syncThread() {
  if (S.chatId && !S.chats.some((c) => c.id === S.chatId)) { // percakapan dihapus
    if (S.chats.length || S.loaded.chats) closeChat(true);
    return;
  }
  if (S.chatId && !$("#chatReply") && $("#chatThread")) renderThread();
}

function markChatRead(id) {
  db.collection("chats").doc(id).update({ unreadAdmin: 0 }).catch(() => { /* diabaikan */ });
}

function openChat(id) {
  if (S.unsubMsgs) { S.unsubMsgs(); S.unsubMsgs = null; }
  S.chatId = id;
  S.chatMsgs = [];
  const wrap = $("#chatWrap");
  if (wrap) wrap.classList.add("in-thread");
  renderChatList();
  renderThread();
  S.unsubMsgs = db.collection("chats").doc(id).collection("messages")
    .orderBy("createdAt", "asc").limitToLast(200)
    .onSnapshot((snap) => {
      S.chatMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
      renderMsgs();
    }, (e) => toast(errMsg(e)));
  const c = S.chats.find((x) => x.id === id);
  if (c && (c.unreadAdmin || 0) > 0) markChatRead(id);
  const ta = $("#replyText");
  if (ta) ta.focus();
}

function closeChat(silent) {
  if (S.unsubMsgs) { S.unsubMsgs(); S.unsubMsgs = null; }
  S.chatId = null;
  S.chatMsgs = [];
  const wrap = $("#chatWrap");
  if (wrap) wrap.classList.remove("in-thread");
  if (!silent || S.page === "chat") { renderChatList(); renderThread(); }
}

async function sendReply(raw) {
  const text = String(raw || "").trim().slice(0, 500);
  if (!text || !S.chatId) return;
  const ref = db.collection("chats").doc(S.chatId);
  try {
    const b = db.batch();
    b.set(ref.collection("messages").doc(), { from: "admin", text, createdAt: TS() });
    b.update(ref, { lastMessage: text.slice(0, 100), lastAt: TS(), lastFrom: "admin", unreadAdmin: 0 });
    await b.commit();
  } catch (e) { toast(errMsg(e)); }
}

async function deleteChat(id) {
  const ref = db.collection("chats").doc(id);
  const snap = await ref.collection("messages").get();
  let batch = db.batch(), n = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  batch.delete(ref);
  await batch.commit();
}

/* =========================================
   SEED DATA DUMMY (dari data.js)
   ========================================= */
async function seedDummy() {
  const ok = await confirmBox({
    title: "Impor data dummy",
    text: `Pengaturan outlet, ${CATEGORIES.length - 1} kategori, ${MENU.length} menu, dan 10 meja contoh akan ditambahkan ke Firestore. Data yang sudah ada tidak dihapus.`,
    ok: "Impor"
  });
  if (!ok) return;
  try {
    const b = db.batch();
    b.set(db.doc("settings/outlet"), {
      name: OUTLET.name, tagline: OUTLET.tagline, badge: OUTLET.badge, brandName: OUTLET.brandName || "",
      jamBuka: OUTLET.jamBuka, sesi: OUTLET.sesi, heroImg: OUTLET.heroImg,
      acceptOrders: true, tzOffset: 420, schedule: DEFAULT_SCHEDULE(), sessionMinutes: 120, serviceRate: 5, taxRate: 10
    }, { merge: true });
    CATEGORIES.filter((c) => c !== "Semua").forEach((name, i) => b.set(db.collection("categories").doc(), { name, order: i + 1 }));
    MENU.forEach((m, i) => b.set(db.collection("menu").doc(), {
      name: m.name, cat: m.cat, price: m.price, desc: m.desc || "", img: m.img || "",
      fav: !!m.fav, best: !!m.best, layout: m.layout === "row" ? "row" : "card",
      active: true, order: i + 1, createdAt: TS()
    }));
    for (let i = 1; i <= 10; i++) {
      const name = "Meja " + String(i).padStart(2, "0");
      b.set(db.collection("tables").doc(slug(name)), { name, area: i <= 6 ? "Indoor" : "Outdoor", order: i });
    }
    await b.commit();
    toast("Data dummy berhasil diimpor.");
  } catch (e) { toast(errMsg(e)); }
}

/* =========================================
   PEMBAYARAN: tolak bukti, terima tunai, batalkan + refund, kedaluwarsa
   ========================================= */
function openRejectForm(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return;
  const left = MAX_PROOF - (o.proofs || []).length;
  const timeOk = payDeadline(o) > Date.now();
  openModal({
    title: "Tolak bukti transfer", small: true,
    body: `<form id="rjForm">
      ${field("Alasan penolakan", `<input name="reason" required maxlength="100" placeholder="Contoh: nominal tidak sesuai">`, "Alasan ini terlihat oleh pelanggan.")}
      <label class="tog" style="margin-bottom:6px"><span class="sw"><input type="checkbox" name="final" ${left > 0 && timeOk ? "" : "checked disabled"}><i></i></span>Tolak permanen (Pesanan Gagal)</label>
      <p class="muted sm" style="line-height:1.5">${left > 0 && timeOk
        ? `Jika tidak dicentang, pelanggan boleh mengirim ulang bukti (sisa ${left} kali, selama waktu bayar belum habis).`
        : "Batas kirim ulang atau waktu bayar sudah habis, jadi pesanan akan menjadi Gagal."}</p>
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn danger" type="submit">Tolak</button></div>
    </form>`,
    mount(root) {
      $("#rjForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const reason = fd.get("reason").trim();
        const permanent = fd.get("final") === "on" || !(left > 0 && timeOk);
        const data = permanent
          ? { status: "gagal", payStatus: "ditolak", payNote: reason, updatedAt: TS() }
          : { status: "menunggu_bayar", payNote: reason, updatedAt: TS() };
        try { await db.collection("orders").doc(id).update(data); closeModal(); toast(permanent ? "Pesanan ditandai Gagal." : "Bukti ditolak. Pelanggan diminta kirim ulang."); }
        catch (ex) { toast(errMsg(ex)); }
      });
    }
  });
}

function openCashForm(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return;
  openModal({
    title: "Terima tunai " + (o.code || ""), small: true,
    body: `<form id="csForm">
      <div class="cash-total"><small>Total tagihan</small><b>${rupiah(o.total)}</b></div>
      ${field("Uang diterima (opsional)", `<input name="given" type="number" min="0" step="500" inputmode="numeric" placeholder="${o.total}">`, "Isi untuk menghitung kembalian.")}
      <div class="cash-change" id="csChange">Kembalian: -</div>
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Batal</button><button class="btn primary" type="submit">Terima &amp; kirim ke dapur</button></div>
    </form>`,
    mount(root) {
      const inp = $("input[name=given]", root), out = $("#csChange", root);
      inp.addEventListener("input", () => {
        const g = Number(inp.value);
        out.textContent = !inp.value ? "Kembalian: -" : g >= o.total ? `Kembalian: ${rupiah(g - o.total)}` : `Uang kurang ${rupiah(o.total - g)}`;
        out.classList.toggle("bad", !!inp.value && g < o.total);
      });
      $("#csForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const g = Number(inp.value) || 0;
        if (g && g < o.total) { toast("Uang yang diterima kurang dari total."); return; }
        const data = { status: "baru", payStatus: "lunas", paidAt: TS(), updatedAt: TS() };
        if (g) { data.cashGiven = g; data.change = g - o.total; }
        try { await db.collection("orders").doc(id).update(data); extendSessionFor(o); closeModal(); toast(g ? `Tunai diterima. Kembalian ${rupiah(g - o.total)}.` : "Tunai diterima."); }
        catch (ex) { toast(errMsg(ex)); }
      });
    }
  });
}

function openCancelForm(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return;
  const paid = o.payStatus === "lunas";
  if (!paid) {
    confirmBox({ title: "Batalkan pesanan", text: `Pesanan ${o.code} akan dibatalkan.`, ok: "Batalkan", danger: true }).then(async (yes) => {
      if (!yes) return;
      try { await db.collection("orders").doc(id).update({ status: "dibatalkan", updatedAt: TS() }); toast("Pesanan dibatalkan."); } catch (ex) { toast(errMsg(ex)); }
    });
    return;
  }
  const full = o.status === "baru";
  openModal({
    title: "Batalkan pesanan berbayar", small: true,
    body: `<form id="cnForm">
      <p class="muted sm" style="line-height:1.5;margin-bottom:12px">Pesanan ${esc(o.code)} sudah dibayar (${rupiah(o.total)}). ${full ? "Belum diproses, jadi disarankan refund penuh." : "Sudah diproses: isi jumlah refund sesuai kebijakan (bagian yang sudah dibuat bisa ditahan)."}</p>
      ${field("Jumlah refund (Rp)", `<input name="amount" type="number" min="0" max="${o.total}" step="500" required value="${full ? o.total : ""}" placeholder="0 sampai ${o.total}">`)}
      ${field("Catatan (opsional)", `<input name="note" maxlength="100" placeholder="Contoh: kedai kehabisan bahan">`)}
      <div class="modal-foot"><button type="button" class="btn ghost" data-close>Kembali</button><button class="btn danger" type="submit">Batalkan pesanan</button></div>
    </form>`,
    mount(root) {
      $("#cnForm", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const amount = Math.round(Number(fd.get("amount")));
        if (!(amount >= 0 && amount <= o.total)) { toast("Jumlah refund harus 0 sampai " + rupiah(o.total)); return; }
        const data = { status: "dibatalkan", updatedAt: TS(), refundAmount: amount, refundStatus: amount > 0 ? "perlu" : "tidak", refundNote: fd.get("note").trim() };
        try { await db.collection("orders").doc(id).update(data); closeModal(); toast(amount > 0 ? "Pesanan dibatalkan. Masuk daftar Perlu refund." : "Pesanan dibatalkan."); }
        catch (ex) { toast(errMsg(ex)); }
      });
    }
  });
}

// Pesanan menunggu bayar yang melewati batas waktu -> kedaluwarsa (berjalan selama panel admin terbuka)
// Pembayaran diterima -> sesi meja pemilik pesanan diperpanjang (agar chat & pemantauan pesanan tetap jalan)
async function extendSessionFor(o) {
  try {
    const t = S.tables.find((x) => x.id === o.mejaId);
    if (!t || !o.sessionId || t.sessionId !== o.sessionId) return;
    const until = Math.max(Date.now() + sessMinutes() * 60000, tms(t.sessionUntil));
    await db.collection("tables").doc(t.id).update({ sessionUntil: firebase.firestore.Timestamp.fromMillis(until) });
  } catch (e) { console.warn("Sesi tidak diperpanjang:", e.message); }
}
const expiring = new Set();
function sweepExpired() {
  if (!S.ordersReady) return;
  S.orders.forEach((o) => {
    if (o.status !== "menunggu_bayar" || expiring.has(o.id)) return;
    if (Date.now() < payDeadline(o) + 3000) return;
    expiring.add(o.id);
    db.collection("orders").doc(o.id).update({ status: "kedaluwarsa", payStatus: "kedaluwarsa", updatedAt: TS() }).catch(() => expiring.delete(o.id));
  });
}
setInterval(sweepExpired, 15000);

/* =========================================
   EVENT DELEGATION
   ========================================= */
document.addEventListener("click", async (e) => {
  if (e.target.matches("[data-close-bg]")) { closeModal(); return; }
  if (e.target.closest("[data-close]")) { closeModal(); return; }
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;

  switch (act) {
    case "nav": go(el.dataset.page); break;
    case "burger": $("#side").classList.contains("open") ? closeSide() : openSide(); break;
    case "logout":
      if (await confirmBox({ title: "Keluar", text: "Yakin ingin keluar dari panel admin?", ok: "Keluar" })) auth.signOut();
      break;
    case "seed": seedDummy(); break;

    case "filter-status": S.filterStatus = el.dataset.key; renderPage(); break;
    case "status":
      try {
        const o = S.orders.find((x) => x.id === id);
        const b = db.batch();
        b.update(db.collection("orders").doc(id), { status: el.dataset.to, updatedAt: TS() });
        // Proses -> perpanjang sesi meja (hanya bila pesanan ini milik sesi yang sedang berjalan)
        if (el.dataset.to === "diproses" && o && o.mejaId && o.sessionId) {
          const t = S.tables.find((x) => x.id === o.mejaId);
          if (t && t.sessionId === o.sessionId && sessEnd(t)) {
            const until = Math.max(Date.now() + sessMinutes() * 60000, tms(t.sessionUntil));
            b.update(db.collection("tables").doc(t.id), { sessionUntil: firebase.firestore.Timestamp.fromMillis(until) });
          }
        }
        await b.commit();
      } catch (ex) { toast(errMsg(ex)); }
      break;
    case "pay-approve": {
      const o = S.orders.find((x) => x.id === id);
      if (!o) break;
      if (await confirmBox({ title: "Setujui pembayaran", text: `Bukti transfer ${o.code} sesuai (${rupiah(o.total)})? Pesanan akan masuk ke dapur.`, ok: "Setujui" })) {
        try { await db.collection("orders").doc(id).update({ status: "baru", payStatus: "lunas", paidAt: TS(), updatedAt: TS() }); toast("Pembayaran disetujui."); extendSessionFor(o); }
        catch (ex) { toast(errMsg(ex)); }
      }
      break;
    }
    case "pay-reject": openRejectForm(id); break;
    case "cash-accept": openCashForm(id); break;
    case "cancel-order": openCancelForm(id); break;
    case "refund-done":
      if (await confirmBox({ title: "Refund selesai", text: "Tandai bahwa uang sudah dikembalikan ke pelanggan?", ok: "Sudah direfund" })) {
        try { await db.collection("orders").doc(id).update({ refundStatus: "selesai", refundedAt: TS(), updatedAt: TS() }); toast("Refund ditandai selesai."); }
        catch (ex) { toast(errMsg(ex)); }
      }
      break;
    case "clear-table": {
      const t = S.tables.find((x) => x.id === id);
      if (t && await confirmBox({ title: "Kosongkan meja", text: `Sesi ${t.name} diakhiri. Pelanggan di meja ini tidak bisa memesan lagi sampai ada yang scan QR.`, ok: "Kosongkan", danger: true })) {
        try { await db.collection("tables").doc(id).update({ sessionId: "", sessionOpenedAt: null, sessionUntil: null }); toast(t.name + " dikosongkan."); }
        catch (ex) { toast(errMsg(ex)); }
      }
      break;
    }
    case "toggle-shop":
      try {
        const next = (S.settings || {}).acceptOrders === false;
        await db.doc("settings/outlet").set({ acceptOrders: next, updatedAt: TS() }, { merge: true });
        toast(next ? "Kedai membuka pesanan." : "Pesanan ditutup sementara.");
      } catch (ex) { toast(errMsg(ex)); }
      break;
    case "del-order":
      if (await confirmBox({ title: "Hapus pesanan", text: "Pesanan ini akan dihapus permanen.", ok: "Hapus", danger: true })) {
        try { await db.collection("orders").doc(id).delete(); toast("Pesanan dihapus."); } catch (ex) { toast(errMsg(ex)); }
      }
      break;

    case "new-menu": openMenuForm(); break;
    case "edit-menu": openMenuForm(id); break;
    case "del-menu": {
      const m = S.menu.find((x) => x.id === id);
      if (m && await confirmBox({ title: "Hapus menu", text: `"${m.name}" akan dihapus permanen.`, ok: "Hapus", danger: true })) {
        try { await db.collection("menu").doc(id).delete(); toast("Menu dihapus."); } catch (ex) { toast(errMsg(ex)); }
      }
      break;
    }

    case "new-cat": openCatForm(); break;
    case "edit-cat": openCatForm(id); break;
    case "move-cat": moveCat(id, parseInt(el.dataset.dir, 10)); break;
    case "del-cat": {
      const c = S.cats.find((x) => x.id === id);
      if (!c) break;
      const n = S.menu.filter((m) => m.cat === c.name).length;
      if (n) { toast(`Masih ada ${n} menu di kategori ini. Pindahkan atau hapus dulu.`); break; }
      if (await confirmBox({ title: "Hapus kategori", text: `Kategori "${c.name}" akan dihapus.`, ok: "Hapus", danger: true })) {
        try { await db.collection("categories").doc(id).delete(); toast("Kategori dihapus."); } catch (ex) { toast(errMsg(ex)); }
      }
      break;
    }

    case "new-table": openTableForm(); break;
    case "bulk-table": openBulkTable(); break;
    case "edit-table": openTableForm(id); break;
    case "qr-table": openQr(id); break;
    case "dl-qr": downloadQr(id); break;
    case "print-table": openPrint([id]); break;
    case "print-tables": openPrint(); break;

    case "open-chat": openChat(id); break;
    case "close-chat": closeChat(); break;
    case "del-chat":
      if (await confirmBox({ title: "Hapus percakapan", text: "Seluruh pesan pada percakapan ini akan dihapus permanen.", ok: "Hapus", danger: true })) {
        try { await deleteChat(id); toast("Percakapan dihapus."); } catch (ex) { toast(errMsg(ex)); }
      }
      break;
    case "copy-table":
      try { await navigator.clipboard.writeText(tableUrl(id)); toast("Tautan meja disalin."); }
      catch (ex) { toast("Tidak bisa menyalin. Gunakan tombol QR untuk melihat tautan."); }
      break;
    case "del-table": {
      const t = S.tables.find((x) => x.id === id);
      if (t && await confirmBox({ title: "Hapus meja", text: `"${t.name}" akan dihapus.`, ok: "Hapus", danger: true })) {
        try { await db.collection("tables").doc(id).delete(); toast("Meja dihapus."); } catch (ex) { toast(errMsg(ex)); }
      }
      break;
    }
  }
});

document.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.matches('[data-act="toggle"]')) {
    try { await db.collection("menu").doc(el.dataset.id).update({ [el.dataset.field]: el.checked, updatedAt: TS() }); }
    catch (ex) { el.checked = !el.checked; toast(errMsg(ex)); }
  }
  if (el.id === "menuCatSel") { S.menuCat = el.value; renderMenuList(); }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "menuSearch") { S.menuQ = e.target.value; renderMenuList(); }
  if (e.target.closest("#setForm")) S.settingsTouched = true;
});

document.addEventListener("submit", async (e) => {
  if (e.target.id === "chatReply") {
    e.preventDefault();
    const ta = $("#replyText");
    const v = ta.value;
    ta.value = "";
    ta.style.height = "";
    sendReply(v);
    return;
  }
  if (e.target.id !== "setForm") return;
  e.preventDefault();
  if (S.ups.hero.busy || S.ups.logo.busy || S.ups.qris.busy) { toast("Tunggu unggahan gambar selesai."); return; }
  const fd = new FormData(e.target);
  const appUrl = (fd.get("appUrl") || "").trim();
  if (appUrl && !/^https?:\/\//i.test(appUrl)) { toast("Alamat aplikasi harus diawali http:// atau https://"); return; }
  const schedule = [];
  for (let i = 0; i < 7; i++) {
    const from = toMin(fd.get(`d${i}_from`)), to = toMin(fd.get(`d${i}_to`));
    const open = fd.get(`d${i}_open`) === "on";
    if (open && (isNaN(from) || isNaN(to) || to <= from)) { toast(`Jam buka ${DAY_NAMES[i]} tidak valid (jam tutup harus setelah jam buka; buka lewat tengah malam belum didukung).`); return; }
    schedule.push({ open, from: isNaN(from) ? 480 : from, to: isNaN(to) ? 1320 : to });
  }
  const sessionMinutes = Math.round(Number(fd.get("sessionMinutes")));
  const serviceRate = Number(fd.get("serviceRate")), taxRate = Number(fd.get("taxRate"));
  if (!(sessionMinutes >= 15 && sessionMinutes <= 720)) { toast("Durasi sesi harus 15 sampai 720 menit."); return; }
  if (!(serviceRate >= 0 && serviceRate <= 30 && taxRate >= 0 && taxRate <= 30)) { toast("Pajak dan layanan harus 0 sampai 30 persen."); return; }
  const payMode = fd.get("payMode") === "awal" ? "awal" : "akhir";
  const payTransfer = fd.get("payTransfer") === "on", payCash = fd.get("payCash") === "on";
  const bankName = fd.get("bankName").trim(), accNo = fd.get("accNo").trim(), accName = fd.get("accName").trim();
  if (payMode === "awal") {
    if (!payTransfer && !payCash) { toast("Aktifkan minimal satu metode pembayaran."); return; }
    if (payTransfer && !S.ups.qris.url && !accNo && !payCash) { toast("Transfer butuh gambar QRIS atau nomor rekening."); return; }
  }
  const open0 = schedule.find((d) => d.open);
  const data = {
    name: fd.get("name").trim(), badge: fd.get("badge").trim(), tagline: fd.get("tagline").trim(),
    schedule, tzOffset: Number(fd.get("tzOffset")), sessionMinutes, serviceRate, taxRate,
    payMode, payTransfer, payCash, bankName, accNo, accName, qrisUrl: S.ups.qris.url,
    jamBuka: open0 ? `${mm(open0.from).replace(":", ".")} - ${mm(open0.to).replace(":", ".")}` : "Tutup",
    heroImg: S.ups.hero.url, logo: S.ups.logo.url,
    brandName: fd.get("brandName").trim(), appUrl,
    updatedAt: TS()
  };
  const btn = $("button[type=submit]", e.target); btn.disabled = true;
  try {
    await db.doc("settings/outlet").set(data, { merge: true });
    S.settingsTouched = false;
    toast("Pengaturan disimpan.");
  } catch (ex) { toast(errMsg(ex)); }
  btn.disabled = false;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); closeSide(); }
  // Enter = kirim balasan, Shift+Enter = baris baru
  if (e.key === "Enter" && !e.shiftKey && e.target.id === "replyText") {
    e.preventDefault();
    $("#chatReply").requestSubmit();
  }
});

hydrate();
applyBrand();
// Logo/nama brand untuk halaman login (settings dapat dibaca publik, jadi tidak perlu login)
try {
  db.doc("settings/outlet").get().then((s) => { if (s.exists && !S.settings) { S.settings = s.data(); applyBrand(); } }).catch(() => {});
} catch (e) { /* diabaikan */ }
