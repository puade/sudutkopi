/* ==========================
   DATA DUMMY - Outletmu
   Ganti URL "img" dengan foto lokal (mis. "img/americano.jpg") bila perlu.
   Jika gambar gagal dimuat, kartu otomatis menampilkan placeholder.
   ========================== */

const U = (id) => `image/${id}?auto=format&fit=crop&w=700&q=75`;

const OUTLET = {
  brandName: "Sudut Kopi",   // teks di header (kosongkan jika logo sudah memuat nama)
  logo: "",                  // URL logo brand (diunggah lewat admin > Pengaturan)
  name: "Masa Rehat",
  tagline: "Jeda sebentar kerjamu, beri stimulan agar fokus terjaga!",
  badge: "Demo POS Basic",
  meja: "Meja 01",
  jamBuka: "08.00 - 22.00",
  area: "Indoor",
  sesi: "2 jam",
  heroImg: U("poster.jpg")
};

const CATEGORIES = ["Semua", "Kopi", "Non Coffee", "Snack", "Makanan", "Dessert"];

const MENU = [
  // Kopi
  { id: 1,  name: "Kopi Susu Gula Aren", price: 22000, cat: "Kopi", fav: true, best: true, img: U("photo-1461023058943-07fcbe16d735"), desc: "Espresso, susu segar, dan gula aren" },
  { id: 2,  name: "Americano Hot",       price: 20000, cat: "Kopi", fav: true, img: U("photo-1514432324607-a09d9b4aefdd"), desc: "Espresso dengan air panas" },
  { id: 3,  name: "Cafe Latte",          price: 24000, cat: "Kopi", fav: true, img: U("photo-1572442388796-11668a67e53d"), desc: "Espresso dengan susu steamed dan latte art" },
  { id: 4,  name: "Cappuccino",          price: 23000, cat: "Kopi", fav: true, img: U("photo-1534778101976-62847782c213"), desc: "Espresso, susu, dan foam tebal" },
  { id: 5,  name: "Espresso Double",     price: 18000, cat: "Kopi", img: U("photo-1510707577719-ae7c14805e3a"), desc: "Dua shot espresso pekat" },
  { id: 6,  name: "Es Kopi Hitam",       price: 19000, cat: "Kopi", img: U("photo-1517701550927-30cf4ba1dba5"), desc: "Kopi hitam dingin yang menyegarkan" },
  { id: 7,  name: "Caramel Macchiato",   price: 28000, cat: "Kopi", img: U("photo-1485808191679-5f86510681a2"), desc: "Susu vanila, espresso, dan saus karamel" },

  // Non Coffee
  { id: 8,  name: "Matcha Latte",        price: 26000, cat: "Non Coffee", img: U("photo-1515823064-d6e0c04616a7"), desc: "Matcha premium dengan susu" },
  { id: 9,  name: "Chocolate Ice",       price: 24000, cat: "Non Coffee", img: U("photo-1572490122747-3968b75cc699"), desc: "Cokelat pekat dengan es dan susu" },
  { id: 10, name: "Thai Tea",            price: 20000, cat: "Non Coffee", img: U("photo-1558857563-b371033873b8"), desc: "Teh Thailand manis creamy" },
  { id: 11, name: "Lemon Tea",           price: 17000, cat: "Non Coffee", img: U("photo-1556679343-c7306c1976bc"), desc: "Teh dengan perasan lemon segar" },

  // Snack
  { id: 12, name: "Kentang Goreng",      price: 18000, cat: "Snack", img: U("photo-1573080496219-bb080dd4f877"), desc: "Kentang goreng renyah dengan saus" },
  { id: 13, name: "Roti Bakar Cokelat",  price: 19000, cat: "Snack", img: U("photo-1484723091739-30a097e8f929"), desc: "Roti bakar dengan selai cokelat dan keju" },
  { id: 14, name: "Pisang Goreng",       price: 15000, cat: "Snack", img: U("photo-1528975604071-b4dc52a2d18c"), desc: "Pisang goreng crispy dengan topping madu" },
  { id: 15, name: "Croissant Butter",    price: 22000, cat: "Snack", img: U("photo-1555507036-ab1f4038808a"), desc: "Croissant butter hangat yang berlapis" },

  // Makanan
  { id: 16, name: "Nasi Ayam Geprek",    price: 28000, cat: "Makanan", fav: true, layout: "row", img: U("photo-1512058564366-18510be2db19"), desc: "Ayam geprek pedas dengan nasi hangat & lalapan" },
  { id: 17, name: "Nasi Goreng Spesial", price: 30000, cat: "Makanan", layout: "row", img: U("photo-1603133872878-684f208fb84b"), desc: "Nasi goreng dengan telur, ayam, dan acar" },
  { id: 18, name: "Mie Goreng Jawa",     price: 27000, cat: "Makanan", layout: "row", img: U("photo-1585032226651-759b368d7246"), desc: "Mie goreng bumbu khas Jawa dengan telur" },
  { id: 19, name: "Chicken Katsu Rice",  price: 32000, cat: "Makanan", layout: "row", img: U("photo-1604908176997-125f25cc6f3d"), desc: "Ayam katsu crispy dengan saus dan nasi" },

  // Dessert
  { id: 20, name: "Tiramisu Cup",        price: 26000, cat: "Dessert", img: U("photo-1571877227200-a0d98ea607e9"), desc: "Lapisan krim mascarpone dan kopi" },
  { id: 21, name: "Brownies Ice Cream",  price: 27000, cat: "Dessert", img: U("photo-1606313564200-e75d5e30476c"), desc: "Brownies hangat dengan es krim vanila" },
  { id: 22, name: "Cheesecake Slice",    price: 29000, cat: "Dessert", img: U("photo-1533134242443-d4fd215305ad"), desc: "Cheesecake lembut dengan saus berry" }
];
