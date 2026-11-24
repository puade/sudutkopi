/* ==========================
   Outletmu - live.js
   Fitur realtime untuk pelanggan (Firestore):
   1. Lonceng notifikasi (daftar + titik belum dibaca)
   2. Pelacakan status pesanan -> toast saat admin memproses / mengantar
   3. Chat ke admin (tombol melayang kanan bawah)
   Dimuat setelah app.js.
   ========================== */

const Live = (() => {
  const KEY = { notif: "outletmu_notifs", orders: "outletmu_orders", chat: "outletmu_chat" };
  const TERMINAL = ["selesai", "dibatalkan", "gagal", "kedaluwarsa"];
  const DAY = 24 * 60 * 60 * 1000;
  const hasDb = typeof db !== "undefined";

  /* ---------- Util ---------- */
  const read = (k, d) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; }
  };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* diabaikan */ } };
  const rid = (bytes = 16) => {
    const a = new Uint8Array(bytes);
    crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const isOpen = (id) => $("#" + id).classList.contains("show");
  const hhmm = (ms) => new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  const SV = () => firebase.firestore.FieldValue.serverTimestamp();

  function ago(ms) {
    const s = Math.max(0, (Date.now() - ms) / 1000);
    if (s < 60) return "Baru saja";
    if (s < 3600) return Math.floor(s / 60) + " menit lalu";
    if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
    return new Date(ms).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  }

  /* =========================================
     1. NOTIFIKASI
     ========================================= */
  let notifs = read(KEY.notif, []);
  const saveNotifs = () => write(KEY.notif, notifs.slice(0, 40));

  const KIND = {
    proses: { ic: "cup" },
    antar: { ic: "truck" },
    selesai: { ic: "check" },
    batal: { ic: "x", warn: true },
    chat: { ic: "chat" },
    info: { ic: "info" }
  };

  function addNotif(kind, title, text, isRead = false) {
    notifs.unshift({ id: rid(6), kind, title, text, ts: Date.now(), read: isRead });
    notifs = notifs.slice(0, 40);
    saveNotifs();
    renderBell();
    if (isOpen("notifSheet")) renderNotifs();
  }

  function renderBell() {
    $("#bellDot").hidden = !notifs.some((n) => !n.read);
  }

  function renderNotifs() {
    const body = $("#notifBody");
    $("#btnClearNotif").hidden = !notifs.length;
    if (!notifs.length) {
      body.innerHTML = `<div class="nf-empty">${icon("bell")}<div>Belum ada notifikasi.</div></div>`;
      return;
    }
    body.innerHTML = notifs.map((n) => {
      const k = KIND[n.kind] || KIND.info;
      return `<div class="nf ${n.read ? "" : "unread"}">
        <div class="nf-ic ${k.warn ? "warn" : ""}">${icon(k.ic)}</div>
        <div class="nf-main">
          <div class="nf-title">${esc(n.title)}</div>
          <div class="nf-text">${esc(n.text)}</div>
          <div class="nf-time">${ago(n.ts)}</div>
        </div>
      </div>`;
    }).join("");
  }

  function openNotifs() {
    renderNotifs();
    openPanel("notifSheet");
    // tandai dibaca setelah dirender (sorotan "baru" tetap terlihat pada pembukaan ini)
    notifs.forEach((n) => { n.read = true; });
    saveNotifs();
    renderBell();
  }

  /* =========================================
     2. PELACAKAN STATUS PESANAN
     Status di admin -> pesan di pelanggan:
       diproses ("Proses")      -> "Pesananmu sedang diproses"
       siap ("Tandai siap")     -> "Pesanan sedang diantar"
     ========================================= */
  const ORDER_MSG = {
    diproses: { kind: "proses", toast: "Pesananmu sedang diproses", ic: "cup", text: (o) => `Pesanan ${o.code} sedang disiapkan.` },
    siap: { kind: "antar", toast: "Pesanan sedang diantar", ic: "truck", text: (o) => `Pesanan ${o.code} sedang diantar ke ${o.meja}.` },
    selesai: { kind: "selesai", toast: "Pesanan selesai. Selamat menikmati!", ic: "check", text: (o) => `Pesanan ${o.code} sudah selesai.` },
    dibatalkan: { kind: "batal", toast: "Pesanan dibatalkan oleh kasir", ic: "x", warn: true, text: (o) => `Pesanan ${o.code} dibatalkan. Hubungi admin lewat chat jika ada pertanyaan.` },
    // pembayaran di awal
    verifikasi: { kind: "info", toast: "Bukti transfer sedang diproses", ic: "clock", text: (o) => `Bukti transfer pesanan ${o.code} sedang diperiksa admin.` },
    terkirim: { kind: "selesai", toast: "Pesanan Terkirim", ic: "check", text: (o) => `Pembayaran ${o.code} diterima. Pesanan masuk ke dapur.` },
    buktiDitolak: { kind: "batal", toast: "Bukti transfer ditolak", ic: "x", warn: true, text: (o) => `Bukti transfer ${o.code} ditolak. Buka pembayaran untuk kirim ulang.` },
    gagal: { kind: "batal", toast: "Pesanan Gagal", ic: "x", warn: true, text: (o) => `Pesanan ${o.code} gagal: pembayaran tidak dapat diverifikasi.` },
    kedaluwarsa: { kind: "batal", toast: "Waktu pembayaran habis", ic: "x", warn: true, text: (o) => `Pesanan ${o.code} dibatalkan karena waktu pembayaran habis.` }
  };

  // { [orderId]: { code, meja, status, ts } } - disimpan di perangkat ini
  let orders = read(KEY.orders, {});
  const orderUnsubs = {};
  const saveOrders = () => write(KEY.orders, orders);

  function stopOrder(id) {
    if (orderUnsubs[id]) { orderUnsubs[id](); delete orderUnsubs[id]; }
  }
  function forgetOrder(id) {
    stopOrder(id);
    delete orders[id];
    saveOrders();
  }

  function onOrderStatus(id, status) {
    const rec = orders[id];
    if (!rec || rec.status === status) return;
    const prev = rec.status;
    rec.status = status;
    saveOrders();
    let key = status;
    if (status === "baru" && (prev === "menunggu_bayar" || prev === "verifikasi")) key = "terkirim";
    if (status === "menunggu_bayar" && prev === "verifikasi") key = "buktiDitolak";
    const m = ORDER_MSG[key];
    if (m) {
      toast(m.toast, m.warn ? "warn" : "ok", m.ic);
      addNotif(m.kind, m.toast, m.text(rec));
    }
    if (TERMINAL.includes(status)) stopOrder(id);
  }

  function watchOrder(id) {
    if (!hasDb || orderUnsubs[id]) return;
    orderUnsubs[id] = db.collection("orders").doc(id).onSnapshot(
      (snap) => {
        if (!snap.exists) { forgetOrder(id); return; } // dihapus admin
        onOrderStatus(id, snap.data().status);
      },
      (e) => {
        console.warn("Gagal memantau pesanan (cek aturan Firestore):", e.code || e.message);
        stopOrder(id);
      }
    );
  }

  function track(id, info) {
    const st = info.status || "baru";
    orders[id] = { code: info.code, meja: info.meja, status: st, ts: Date.now() };
    saveOrders();
    watchOrder(id);
    if (st === "menunggu_bayar") addNotif("info", "Menunggu pembayaran", `Pesanan ${info.code} dibuat. Selesaikan pembayaran agar pesanan diproses.`, true);
    else addNotif("info", "Pesanan terkirim", `Pesanan ${info.code} diterima dan menunggu diproses.`, true);
  }

  /* =========================================
     3. CHAT KE ADMIN
     chats/{chatId}            : ringkasan percakapan (dibaca admin)
     chats/{chatId}/messages   : isi pesan
     chatId = kode acak di perangkat ini (tanpa login)
     ========================================= */
  let chat = Object.assign({ id: "", created: false, lastRead: 0, seenAt: 0 }, read(KEY.chat, {}));
  let msgs = [];
  let chatUnsub = null;
  const saveChat = () => write(KEY.chat, chat);

  const msgTime = (x) => (x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now());
  const unreadCount = () => msgs.filter((m) => m.from === "admin" && m.ts > chat.lastRead).length;

  function renderFab() {
    const n = unreadCount();
    const b = $("#fabBadge");
    b.hidden = n === 0;
    b.textContent = n > 9 ? "9+" : n;
  }

  function markRead() {
    const last = msgs.filter((m) => m.from === "admin").reduce((a, m) => Math.max(a, m.ts), 0);
    chat.lastRead = Math.max(chat.lastRead, last);
    saveChat();
    renderFab();
  }

  function renderChat(forceScroll) {
    const body = $("#chatBody");
    const stick = forceScroll || body.scrollHeight - body.scrollTop - body.clientHeight < 80;
    if (!msgs.length) {
      body.innerHTML = `<div class="chat-empty">${icon("chat")}<div>Ada yang bisa dibantu?<br>Tulis pesanmu, admin akan membalas di sini.</div></div>`;
    } else {
      body.innerHTML = msgs.map((m) =>
        `<div class="msg ${m.from === "admin" ? "admin" : "me"}">${m.image ? `<a href="${esc(m.image)}" target="_blank" rel="noopener"><img class="msg-img" src="${esc(m.image)}" alt="Gambar"></a>` : ""}${esc(m.text)}<small>${hhmm(m.ts)}</small></div>`).join("");
    }
    if (stick) body.scrollTop = body.scrollHeight;
  }

  function watchChat() {
    if (!hasDb || chatUnsub || !chat.id) return;
    chatUnsub = db.collection("chats").doc(chat.id).collection("messages")
      .orderBy("createdAt", "asc").limitToLast(100)
      .onSnapshot((snap) => {
        msgs = snap.docs.map((d) => {
          const x = d.data({ serverTimestamps: "estimate" });
          return { id: d.id, from: x.from, text: x.text || "", image: x.image || "", ts: msgTime(x) };
        });
        const open = isOpen("chatSheet");
        const fresh = msgs.filter((m) => m.from === "admin" && m.ts > chat.seenAt);
        if (fresh.length) {
          chat.seenAt = Math.max(...fresh.map((m) => m.ts));
          if (!open) {
            fresh.slice(-3).forEach((m) => addNotif("chat", "Balasan dari admin", m.text.slice(0, 120)));
            toast("Pesan baru dari admin", "info", "chat");
          }
        }
        if (open) markRead(); else saveChat();
        renderChat();
        renderFab();
      }, (e) => {
        console.warn("Gagal memuat chat (cek aturan Firestore):", e.code || e.message);
        chatUnsub = null;
      });
  }

  function openChat() {
    $("#chatSub").textContent = `${OUTLET.meja} · Tanyakan pesanan atau menu`;
    renderChat(true);
    openPanel("chatSheet");
    markRead();
    setTimeout(() => { $("#chatBody").scrollTop = $("#chatBody").scrollHeight; $("#chatInput").focus(); }, 350);
  }

  async function sendChat(raw) {
    const text = String(raw || "").trim().slice(0, 500);
    if (!text || !hasDb) return;
    if (!Session.canChat()) { toast("Sesi meja berakhir. Scan ulang QR untuk chat.", "warn", "info"); return; }
    if (!chat.id) { chat.id = "c" + rid(16); saveChat(); }
    watchChat(); // pasang listener dulu agar pesan langsung tampil
    const ref = db.collection("chats").doc(chat.id);
    const btn = $("#chatForm .chat-send");
    btn.disabled = true;
    try {
      const batch = db.batch();
      batch.set(ref, {
        mejaId: TABLE.id || "",
        sessionId: Session.sid() || "",
        mejaName: OUTLET.meja || "",
        area: OUTLET.area || "",
        lastMessage: text.slice(0, 100),
        lastAt: SV(),
        lastFrom: "user",
        unreadAdmin: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });
      batch.set(ref.collection("messages").doc(), { from: "user", text, createdAt: SV() });
      await batch.commit();
      if (!chat.created) { chat.created = true; saveChat(); }
    } catch (e) {
      console.error(e);
      toast(e && e.code === "permission-denied" ? "Sesi meja berakhir. Scan ulang QR untuk chat." : "Pesan gagal terkirim. Coba lagi.", "warn", "x");
    } finally {
      btn.disabled = false;
    }
  }

  // Kirim gambar (bukti transfer) ke chat admin. Upaya terbaik: gagal tidak mengganggu pembayaran.
  async function sendImage(url, text) {
    if (!hasDb || !Session.canChat()) return;
    try {
      if (!chat.id) { chat.id = "c" + rid(16); saveChat(); }
      watchChat();
      const ref = db.collection("chats").doc(chat.id);
      const batch = db.batch();
      batch.set(ref, {
        mejaId: TABLE.id || "", sessionId: Session.sid() || "", mejaName: OUTLET.meja || "", area: OUTLET.area || "",
        lastMessage: String(text).slice(0, 100), lastAt: SV(), lastFrom: "user",
        unreadAdmin: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });
      batch.set(ref.collection("messages").doc(), { from: "user", text: String(text).slice(0, 500), image: url, createdAt: SV() });
      await batch.commit();
      if (!chat.created) { chat.created = true; saveChat(); }
    } catch (e) { console.warn("Bukti tidak tersalin ke chat:", e.code || e.message); }
  }

  /* ---------- Sesi meja ---------- */
  // Pelanggan baru di meja ini: hapus riwayat pelanggan sebelumnya (notifikasi, pesanan terlacak, chat)
  function reset() {
    Object.keys(orderUnsubs).forEach(stopOrder);
    if (chatUnsub) { chatUnsub(); chatUnsub = null; }
    notifs = []; orders = {}; msgs = [];
    chat = { id: "", created: false, lastRead: 0, seenAt: 0 };
    saveNotifs(); saveOrders(); saveChat();
    renderBell(); renderFab(); renderChat(); renderNotifs();
  }

  function onSessionChange() {
    if (Session.changedSince("outletmu_live_sid")) reset();
    $("#fabWrap").hidden = !(hasDb && Session.canChat());
    if (!Session.canChat() && isOpen("chatSheet")) closeSheet();
  }

  /* ---------- Mulai ---------- */
  function init() {
    hydrateIcons();
    if (Session.changedSince("outletmu_live_sid")) reset();
    $("#fabWrap").hidden = !(hasDb && Session.canChat()); // chat butuh Firestore + sesi meja aktif
    Session.onChange(onSessionChange);
    renderBell();
    renderFab();

    $("#btnBell").addEventListener("click", openNotifs);
    $("#btnClearNotif").addEventListener("click", () => {
      notifs = [];
      saveNotifs();
      renderNotifs();
      renderBell();
    });
    $("#btnChat").addEventListener("click", openChat);
    $("#chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#chatInput");
      const v = input.value;
      input.value = "";
      sendChat(v);
      input.focus();
    });

    if (!hasDb) return;
    const now = Date.now();
    Object.keys(orders).forEach((id) => {
      const o = orders[id];
      if (now - o.ts > DAY || TERMINAL.includes(o.status)) delete orders[id];
      else watchOrder(id);
    });
    saveOrders();
    if (chat.created) watchChat();
  }

  (window.appReady || Promise.resolve()).then(init);

  return { track, sendImage, notify: (kind, title, text) => addNotif(kind, title, text) };
})();
