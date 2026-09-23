/* =========================================================
   BEKULEZAT — SHAKEN FROZEN FOOD LANDING PAGE
   Logika: render katalog, pilihan sambal, keranjang, total, checkout WA
   ========================================================= */

/* -----------------------------------------------------------
   1. PENGATURAN TOKO — EDIT DI SINI
   ----------------------------------------------------------- */

// Nomor WhatsApp admin, format: kode negara TANPA "+" dan TANPA angka 0 di depan.
// Contoh: nomor 0896-7378-7320 ditulis menjadi "6289673787320"
const NOMOR_WA_ADMIN = "6289673787320";

// Daftar produk. Silakan tambah, hapus, atau edit langsung di sini.
// icon         : emoji sebagai placeholder gambar (bisa diganti pakai <img> jika sudah punya foto asli)
// price        : harga dalam Rupiah (angka biasa, tanpa titik/koma)
// tag          : label kecil di pojok produk (opsional, boleh dikosongkan jadi "")
// flavors      : daftar pilihan sambal/bumbu. Kosongkan array [] kalau produk tidak butuh pilihan sambal.
const PRODUCTS = [
  {
    id: "shaken-bawang",
    name: "Shaken Bites Bawang",
    tag: "Best Seller",
    desc: "Mix bakso, sosis, nugget & otak-otak, digoreng lalu dikocok sambal bawang gurih.",
    price: 20000,
    unit: "porsi",
    icon: "🥡",
    flavors: ["Sambal Bawang Original", "Sambal Bawang Extra Pedas 🔥"]
  },
  {
    id: "shaken-chili-oil",
    name: "Shaken Bites Chili Oil",
    tag: "Pedas",
    desc: "Mix bakso, sosis, nugget & otak-otak, dikocok bareng chili oil pedas nampol.",
    price: 22000,
    unit: "porsi",
    icon: "🌶️",
    flavors: ["Chili Oil Sedang", "Chili Oil Extra Pedas 🔥🔥"]
  },
  {
    id: "mix-frozen-mentah",
    name: "Mix Frozen Pack Mentah + Sambal",
    tag: "Stok Kos",
    desc: "Paket vakum mentah (bakso, sosis, nugget, otak-otak) + sambal terpisah, simpan di freezer.",
    price: 35000,
    unit: "paket",
    icon: "🧊",
    flavors: ["Sambal Bawang", "Sambal Chili Oil"]
  },
  {
    id: "paket-nobar-hemat",
    name: "Paket Nobar Hemat",
    tag: "Rame-rame",
    desc: "Porsi besar campuran semua item untuk 3-4 orang, lengkap dengan sambal pilihan.",
    price: 45000,
    unit: "paket besar",
    icon: "🍿",
    flavors: ["Sambal Bawang", "Sambal Chili Oil", "Campur (Bawang + Chili Oil)"]
  }
];

/* -----------------------------------------------------------
   2. STATE KERANJANG
   ----------------------------------------------------------- */

// Struktur cart: { "shaken-bawang::Sambal Bawang Original": { qty: 2, flavor: "..." }, ... }
let cart = loadCart();

function loadCart() {
  try {
    const saved = localStorage.getItem("bekulezat_shaken_cart");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem("bekulezat_shaken_cart", JSON.stringify(cart));
  } catch (e) {
    /* localStorage tidak tersedia, keranjang tetap jalan tapi tidak tersimpan */
  }
}

function formatRupiah(number) {
  return "Rp " + number.toLocaleString("id-ID");
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function makeCartKey(productId, flavor) {
  return `${productId}::${flavor || "-"}`;
}

function getCartTotal() {
  let total = 0;
  for (const key in cart) {
    const entry = cart[key];
    const product = getProduct(entry.productId);
    if (product) total += product.price * entry.qty;
  }
  return total;
}

function getCartCount() {
  return Object.values(cart).reduce((sum, entry) => sum + entry.qty, 0);
}

/* -----------------------------------------------------------
   3. RENDER KATALOG PRODUK
   ----------------------------------------------------------- */

const productGrid = document.getElementById("productGrid");

// Menyimpan jumlah & pilihan sambal sementara (sebelum ditambah ke keranjang) per produk
const pendingQty = {};
const pendingFlavor = {};
PRODUCTS.forEach((p) => {
  pendingQty[p.id] = 1;
  pendingFlavor[p.id] = p.flavors && p.flavors.length ? p.flavors[0] : "";
});

function renderCatalog() {
  productGrid.innerHTML = PRODUCTS.map((product) => {
    const flavorSelect = product.flavors && product.flavors.length
      ? `
        <div class="flavor-row">
          <label for="flavor-${product.id}">Pilihan Sambal / Bumbu</label>
          <select id="flavor-${product.id}" data-id="${product.id}" class="flavor-select">
            ${product.flavors.map((f) => `<option value="${f}">${f}</option>`).join("")}
          </select>
        </div>
      `
      : "";

    return `
      <div class="product-card">
        <div class="product-top">
          <div class="product-icon">${product.icon}</div>
          <div>
            ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
            <h3>${product.name}</h3>
          </div>
        </div>
        <p class="product-desc">${product.desc}</p>
        <p class="product-price">
          ${formatRupiah(product.price)} <small>/ ${product.unit}</small>
        </p>
        ${flavorSelect}
        <div class="qty-row">
          <button class="qty-btn" data-action="decrease" data-id="${product.id}">−</button>
          <span class="qty-value" id="qty-${product.id}">1</span>
          <button class="qty-btn" data-action="increase" data-id="${product.id}">+</button>
        </div>
        <button class="add-btn" data-action="add" data-id="${product.id}">Tambah ke Keranjang</button>
      </div>
    `;
  }).join("");
}

productGrid.addEventListener("change", (e) => {
  if (e.target.classList.contains("flavor-select")) {
    pendingFlavor[e.target.dataset.id] = e.target.value;
  }
});

productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "increase") {
    pendingQty[id] += 1;
    document.getElementById(`qty-${id}`).textContent = pendingQty[id];
  }

  if (action === "decrease") {
    pendingQty[id] = Math.max(1, pendingQty[id] - 1);
    document.getElementById(`qty-${id}`).textContent = pendingQty[id];
  }

  if (action === "add") {
    const flavor = pendingFlavor[id] || "";
    const key = makeCartKey(id, flavor);

    if (cart[key]) {
      cart[key].qty += pendingQty[id];
    } else {
      cart[key] = { productId: id, flavor: flavor, qty: pendingQty[id] };
    }

    pendingQty[id] = 1;
    document.getElementById(`qty-${id}`).textContent = 1;

    saveCart();
    renderCart();
    openCartDrawer();
  }
});

/* -----------------------------------------------------------
   4. RENDER KERANJANG (drawer + ringkasan di form)
   ----------------------------------------------------------- */

const cartItemsEl = document.getElementById("cartItems");
const drawerTotalEl = document.getElementById("drawerTotal");
const cartCountEl = document.getElementById("cartCount");
const summaryItemsEl = document.getElementById("summaryItems");
const summaryTotalEl = document.getElementById("summaryTotal");

function renderCart() {
  const keys = Object.keys(cart).filter((k) => cart[k].qty > 0);
  const total = getCartTotal();

  // Badge jumlah item di header
  cartCountEl.textContent = getCartCount();

  // Drawer keranjang
  if (keys.length === 0) {
    cartItemsEl.innerHTML = `<p class="empty-note">Keranjang masih kosong.</p>`;
  } else {
    cartItemsEl.innerHTML = keys.map((key) => {
      const entry = cart[key];
      const product = getProduct(entry.productId);
      return `
        <div class="cart-item">
          <div class="cart-item-icon">${product.icon}</div>
          <div class="cart-item-info">
            <h4>${product.name}</h4>
            ${entry.flavor ? `<p class="cart-item-flavor">${entry.flavor}</p>` : ""}
            <p>${formatRupiah(product.price)} x ${entry.qty} = ${formatRupiah(product.price * entry.qty)}</p>
            <div class="cart-item-controls">
              <button class="qty-btn" data-action="cart-decrease" data-key="${key}">−</button>
              <span class="qty-value">${entry.qty}</span>
              <button class="qty-btn" data-action="cart-increase" data-key="${key}">+</button>
              <button class="cart-item-remove" data-action="cart-remove" data-key="${key}">Hapus</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
  drawerTotalEl.textContent = formatRupiah(total);

  // Ringkasan di dekat form pemesanan
  if (keys.length === 0) {
    summaryItemsEl.innerHTML = `<p class="empty-note">Keranjang masih kosong. Yuk pilih menu dulu 👆</p>`;
  } else {
    summaryItemsEl.innerHTML = keys.map((key) => {
      const entry = cart[key];
      const product = getProduct(entry.productId);
      const label = entry.flavor ? `${product.name} (${entry.flavor})` : product.name;
      return `
        <div class="summary-item">
          <span>${label} x${entry.qty}</span>
          <span>${formatRupiah(product.price * entry.qty)}</span>
        </div>
      `;
    }).join("");
  }
  summaryTotalEl.textContent = formatRupiah(total);
}

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const key = btn.dataset.key;
  const action = btn.dataset.action;

  if (action === "cart-increase") cart[key].qty += 1;
  if (action === "cart-decrease") {
    cart[key].qty -= 1;
    if (cart[key].qty <= 0) delete cart[key];
  }
  if (action === "cart-remove") delete cart[key];

  saveCart();
  renderCart();
});

/* -----------------------------------------------------------
   5. CART DRAWER: buka / tutup
   ----------------------------------------------------------- */

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

function openCartDrawer() {
  cartDrawer.classList.add("active");
  cartOverlay.classList.add("active");
}
function closeCartDrawer() {
  cartDrawer.classList.remove("active");
  cartOverlay.classList.remove("active");
}

document.getElementById("cartToggle").addEventListener("click", openCartDrawer);
document.getElementById("cartClose").addEventListener("click", closeCartDrawer);
cartOverlay.addEventListener("click", closeCartDrawer);
document.getElementById("goToForm").addEventListener("click", closeCartDrawer);

/* -----------------------------------------------------------
   6. MENU MOBILE (hamburger)
   ----------------------------------------------------------- */

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
mainNav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => mainNav.classList.remove("open"))
);

/* -----------------------------------------------------------
   7. CHECKOUT — SUSUN PESAN & KIRIM KE WHATSAPP
   ----------------------------------------------------------- */

const orderForm = document.getElementById("orderForm");

orderForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const keys = Object.keys(cart).filter((k) => cart[k].qty > 0);
  if (keys.length === 0) {
    alert("Keranjang masih kosong. Silakan pilih menu di katalog terlebih dahulu ya 🙏");
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const delivery = document.getElementById("deliveryMethod").value;
  const note = document.getElementById("custNote").value.trim();

  // Susun daftar item
  let itemLines = "";
  keys.forEach((key) => {
    const entry = cart[key];
    const product = getProduct(entry.productId);
    const flavorText = entry.flavor ? ` - ${entry.flavor}` : "";
    itemLines += `- ${product.name}${flavorText} (${entry.qty} ${product.unit}) = ${formatRupiah(product.price * entry.qty)}\n`;
  });

  const total = getCartTotal();

  // Susun pesan WhatsApp yang rapi
  const message =
`Halo BekuLezat, saya mau pesan:

${itemLines}
Total: ${formatRupiah(total)}

Data Pemesan:
Nama: ${name}
No. WhatsApp: ${phone}
Alamat: ${address}
Metode: ${delivery}
Catatan: ${note ? note : "-"}

Mohon konfirmasi ketersediaan dan ongkir ya, terima kasih 🙏`;

  const waUrl = `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
});

/* -----------------------------------------------------------
   8. INISIALISASI
   ----------------------------------------------------------- */

document.getElementById("year").textContent = new Date().getFullYear();

renderCatalog();
renderCart();
