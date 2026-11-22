/* ==========================
   Konfigurasi Firebase & Cloudinary
   Dipakai bersama oleh index.html (pelanggan) dan admin.html.
   Catatan: kunci Firebase web memang publik. Keamanan data diatur
   oleh aturan Firestore (lihat firestore.rules), bukan oleh kunci ini.
   ========================== */

const firebaseConfig = {
  apiKey: "AIzaSyBs4xp8EwgDxmR6vgd5THOs1yCe7wLYD4E",
  authDomain: "sudut-kopi-4d7b9.firebaseapp.com",
  projectId: "sudut-kopi-4d7b9",
  storageBucket: "sudut-kopi-4d7b9.firebasestorage.app",
  messagingSenderId: "943910575653",
  appId: "1:943910575653:web:5d0ae1ecfa3071469f69cc"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Upload gambar (unsigned preset harus berstatus "Unsigned" di dashboard Cloudinary)
const CLOUDINARY = {
  cloudName: "yjthurvv",
  uploadPreset: "sudutkopi-app"
};
