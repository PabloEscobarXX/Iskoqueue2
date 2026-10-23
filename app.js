// ---------- State ----------
let activeCategory = "All";
let query = "";

// ---------- Elements ----------
const $cards = document.getElementById("cards");
const $count = document.getElementById("count");
const $chips = document.getElementById("chips");
const $search = document.getElementById("search");
const $listView = document.getElementById("list-view");
const $detailView = document.getElementById("detail-view");
const $home = document.getElementById("home");
const $results = document.getElementById("results");
const $craveForm = document.getElementById("crave-form");
const $craveInput = document.getElementById("crave-input");
const $suggest = document.getElementById("suggest");
const $homeCats = document.getElementById("home-cats");
const $homeStalls = document.getElementById("home-stalls");
const $auth = document.getElementById("auth");
const $adminPanel = document.getElementById("admin-panel");
const $vendorPanel = document.getElementById("vendor-panel");
const cart = new Map();

// ---------- Map setup ----------
// Start focused on the stalls while allowing fitBounds to zoom in along the route.
const PUP_CENTER = [14.59765, 121.01034];

const map = L.map("map", {
  center: PUP_CENTER,
  zoom: 18,
  minZoom: 17,
  maxZoom: 19,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

function makePin(stall) {
  return L.divIcon({
    className: "",
    html: `<div class="pin" style="background:${stall.color}"><span>${stall.emoji}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

// ---------- Helpers ----------
function isOpenNow(stall) {
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  // handles places that close after midnight (e.g. open 18, close 4)
  return stall.open < stall.close
    ? hour >= stall.open && hour < stall.close
    : hour >= stall.open || hour < stall.close;
}

function formatHour(h) {
  const hh = h % 24;
  const suffix = hh >= 12 ? "PM" : "AM";
  const twelve = hh % 12 === 0 ? 12 : hh % 12;
  return `${twelve}:00 ${suffix}`;
}

const peso = (n) => "₱" + n.toLocaleString("en-PH");

function matches(stall) {
  const inCategory = activeCategory === "All" || stall.category === activeCategory;
  const q = query.trim().toLowerCase();
  if (!q) return inCategory;
  const inText =
    stall.name.toLowerCase().includes(q) ||
    stall.category.toLowerCase().includes(q) ||
    stall.area.toLowerCase().includes(q) ||
    stall.menu.some((m) => m.name.toLowerCase().includes(q));
  return inCategory && inText;
}

// ---------- Category chips ----------
function renderChips() {
  const categories = ["All", ...new Set(STALLS.map((s) => s.category))];
  $chips.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = cat;
    btn.setAttribute("aria-pressed", String(cat === activeCategory));
    btn.addEventListener("click", () => {
      activeCategory = cat;
      renderChips();
      renderList();
    });
    $chips.appendChild(btn);
  });
}

// ---------- List + markers ----------
function renderList() {
  const results = STALLS.filter(matches);

  $count.textContent = `${results.length} ${results.length === 1 ? "stall" : "stalls"} found`;
  $cards.innerHTML = "";
  markerLayer.clearLayers();

  if (results.length === 0) {
    $cards.innerHTML = `<li class="empty">No stalls match your search. Try a different dish or category.</li>`;
    return;
  }

  results.forEach((stall) => {
    // card
    const open = isOpenNow(stall);
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="card" type="button">
        <div class="thumb" style="background:${stall.color}22">${stall.emoji}</div>
        <div>
          <h3>${stall.name}</h3>
          <div class="meta">${stall.category} · ${stall.area}</div>
          <div class="row">
            <span>★ ${stall.rating}</span>
            <span>${stall.eta}</span>
            <span>Delivery ${peso(stall.deliveryFee)}</span>
            <span class="status ${open ? "is-open" : "is-closed"}">${open ? "Open now" : "Closed"}</span>
          </div>
        </div>
      </button>`;
    li.querySelector("button").addEventListener("click", () => showDetail(stall));
    $cards.appendChild(li);

    // map marker
    L.marker([stall.lat, stall.lng], { icon: makePin(stall), title: stall.name })
      .addTo(markerLayer)
      .bindTooltip(stall.name)
      .on("click", () => showDetail(stall));
  });

  // zoom the map so every result is visible
  const bounds = L.latLngBounds(results.map((s) => [s.lat, s.lng]));
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
}

// ---------- Detail view (menu + location) ----------
function showDetail(stall) {
  const open = isOpenNow(stall);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${stall.lat},${stall.lng}`;

  $detailView.innerHTML = `
    <button class="back" type="button">← Back to all stalls</button>
    <div class="hero" style="background:${stall.color}22">${stall.emoji}</div>
    <h2>${stall.name}</h2>
    <div class="meta">${stall.category} · ★ ${stall.rating}</div>
    <div class="row">
      <span class="status ${open ? "is-open" : "is-closed"}">${open ? "Open now" : "Closed"}</span>
      <span>${stall.open === 0 && stall.close === 24 ? "Open 24 hours" : `${formatHour(stall.open)} – ${formatHour(stall.close)}`}</span>
    </div>
    <p class="meta">📍 ${stall.area}</p>
    <div class="actions">
      <a class="btn" href="${directions}" target="_blank" rel="noopener">Get directions</a>
    </div>
    <h3 class="menu-title">Menu</h3>
    <ul class="menu">
      ${stall.menu
        .map(
          (m, index) => `
        <li>
          <div>
            <div class="dish">${m.name}</div>
            ${m.desc ? `<div class="desc">${m.desc}</div>` : ""}
          </div>
          <div class="menu-buy"><div class="price">${peso(m.price)}</div><button class="add-to-cart" type="button" data-item="${index}" aria-label="Add ${m.name} to cart">+</button></div>
        </li>`
        )
        .join("")}
    </ul>`;

  $detailView.querySelector(".back").addEventListener("click", showList);
  $detailView.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => addToCart(stall, stall.menu[Number(button.dataset.item)]));
  });

  $listView.hidden = true;
  $detailView.hidden = false;
  document.getElementById("panel").scrollTop = 0;

  // zoom the map to this stall
  map.flyTo([stall.lat, stall.lng], 18, { duration: 0.8 });
}

function showList() {
  $detailView.hidden = true;
  $listView.hidden = false;
  renderList();
}

// ---------- Search ----------
$search.addEventListener("input", (e) => {
  query = e.target.value;
  if (!$detailView.hidden) {
    $detailView.hidden = true;
    $listView.hidden = false;
  }
  renderList();
});

// ---------- Home page <-> results page ----------
const SUGGESTIONS = ["Isaw", "Milk tea", "Silog", "Turon", "Lugaw", "Inihaw"];

function makeHomeChip(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "home-chip";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderHome() {
  $suggest.innerHTML = "";
  SUGGESTIONS.forEach((word) =>
    $suggest.appendChild(makeHomeChip(word, () => showResults({ q: word })))
  );

  $homeCats.innerHTML = "";
  const categoryIcons = { "Street food": "🍢", "Rice meals": "🍳", Drinks: "🧋", Dessert: "🍰", Grill: "🍗" };
  [...new Set(STALLS.map((s) => s.category))].forEach((cat) => {
    const btn = makeHomeChip(cat, () => showResults({ cat }));
    btn.innerHTML = `<span aria-hidden="true">${categoryIcons[cat] || "🍴"}</span><span>${cat}</span>`;
    $homeCats.appendChild(btn);
  });

  $homeStalls.innerHTML = "";
  STALLS.forEach((stall) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stall-circle";
    button.innerHTML = `<span class="stall-emoji" style="--stall-color:${stall.color}" aria-hidden="true">${stall.emoji}</span><span class="stall-name"></span>`;
    button.querySelector(".stall-name").textContent = stall.name;
    button.addEventListener("click", () => showResults({ q: stall.name }));
    $homeStalls.appendChild(button);
  });
}

function showResults({ q = "", cat = "All" } = {}) {
  query = q;
  activeCategory = cat;
  $search.value = q;

  $home.hidden = true;
  $auth.hidden = true;
  $results.hidden = false;
  $detailView.hidden = true;
  $listView.hidden = false;

  map.invalidateSize(); // the map was hidden, so tell Leaflet its real size
  renderChips();
  renderList();
  window.scrollTo(0, 0);
}

function showHome() {
  $results.hidden = true;
  $auth.hidden = true;
  $home.hidden = false;
  $craveInput.value = "";
  $craveInput.focus();
}

$craveForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showResults({ q: $craveInput.value });
});
document.getElementById("see-all").addEventListener("click", () => showResults());
document.getElementById("promo-browse").addEventListener("click", () => showResults());
document.getElementById("brand").addEventListener("click", showHome);

// ---------- Demo cart ----------
const $cartToggle = document.getElementById("cart-toggle");
const $cartPanel = document.getElementById("cart-panel");
const $cartItems = document.getElementById("cart-items");
const $cartEmpty = document.getElementById("cart-empty");
const $cartCount = document.getElementById("cart-count");
const $cartTotal = document.getElementById("cart-total");
const $cartCheckout = document.getElementById("cart-checkout");
const $cartMessage = document.getElementById("cart-message");
const $cartContent = document.getElementById("cart-content");
const $checkoutFlow = document.getElementById("checkout-flow");
const $pickupStep = document.getElementById("pickup-step");
const $reviewStep = document.getElementById("review-step");
const $orderComplete = document.getElementById("order-complete");
const $pickupTime = document.getElementById("pickup-time");
const $pickupTimeLabel = document.getElementById("pickup-time-label");
const $vendorQr = document.getElementById("vendor-qr");
const $placeOrder = document.getElementById("place-order");
let selectedPayment = "";
let activeCustomerOrderId = "";
let vendorAudioContext = null;
let vendorOrderSoundEnabled = false;

function addToCart(stall, item) {
  const currentStallId = cart.size ? Number([...cart.keys()][0].split(":")[0]) : null;
  if (currentStallId !== null && currentStallId !== stall.id) {
    $cartMessage.textContent = "Checkout is one stall at a time. Remove the current stall's items before adding from another stall.";
    $cartPanel.hidden = false;
    $cartToggle.setAttribute("aria-expanded", "true");
    return;
  }
  const key = `${stall.id}:${item.name}`;
  const existing = cart.get(key);
  cart.set(key, { key, stallName: stall.name, name: item.name, price: item.price, quantity: (existing?.quantity || 0) + 1 });
  $cartMessage.textContent = `${item.name} added to your cart.`;
  $cartContent.hidden = false;
  $checkoutFlow.hidden = true;
  renderCart();
}

function renderCart() {
  const items = [...cart.values()];
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $cartCount.textContent = String(quantity);
  $cartTotal.textContent = peso(total);
  $cartItems.innerHTML = "";
  $cartEmpty.hidden = items.length > 0;
  $cartCheckout.disabled = items.length === 0;
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    const detail = document.createElement("span");
    detail.className = "cart-item-detail";
    detail.textContent = `${item.quantity} × ${item.name} · ${item.stallName}`;
    const price = document.createElement("strong");
    price.textContent = peso(item.price * item.quantity);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "cart-remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${item.name} from cart`);
    remove.addEventListener("click", () => {
      cart.delete(item.key);
      $cartMessage.textContent = `${item.name} removed from your cart.`;
      $cartContent.hidden = false;
      $checkoutFlow.hidden = true;
      renderCart();
    });
    li.append(detail, price, remove);
    $cartItems.appendChild(li);
  });
}

$cartToggle.addEventListener("click", () => {
  const willOpen = $cartPanel.hidden;
  $cartPanel.hidden = !willOpen;
  $cartToggle.setAttribute("aria-expanded", String(willOpen));
});
document.getElementById("cart-close").addEventListener("click", () => {
  $cartPanel.hidden = true;
  $cartToggle.setAttribute("aria-expanded", "false");
});
$cartCheckout.addEventListener("click", () => {
  const quantity = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  const estimate = 8 + Math.max(0, quantity - 1) * 3;
  document.getElementById("pickup-estimate").textContent = `Estimated pickup: about ${estimate} minutes · ${quantity} ${quantity === 1 ? "item" : "items"} in this order`;
  $cartMessage.textContent = "";
  $cartContent.hidden = true;
  $checkoutFlow.hidden = false;
  $pickupStep.hidden = false;
  $reviewStep.hidden = true;
  $orderComplete.hidden = true;
  document.getElementById("checkout-step-label").textContent = "1 of 2 · Pickup";
  document.getElementById("checkout-back").hidden = true;
  selectedPayment = "";
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => { radio.checked = false; });
  $vendorQr.hidden = true;
  $placeOrder.disabled = true;
});

document.querySelectorAll('input[name="pickup-option"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const later = radio.checked && radio.value === "later";
    $pickupTime.hidden = !later;
    $pickupTimeLabel.hidden = !later;
    $pickupTime.required = later;
    if (later) {
      const earliestPickup = new Date();
      earliestPickup.setMinutes(earliestPickup.getMinutes() + 1, 0, 0);
      $pickupTime.min = new Date(earliestPickup.getTime() - earliestPickup.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    if (later && !$pickupTime.value) {
      const soon = new Date(Date.now() + 60 * 60 * 1000);
      soon.setMinutes(Math.ceil(soon.getMinutes() / 15) * 15, 0, 0);
      $pickupTime.value = new Date(soon.getTime() - soon.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
  });
});

function selectedPickupDescription() {
  const option = document.querySelector('input[name="pickup-option"]:checked').value;
  if (option === "now") return "As soon as the order is ready";
  if (!$pickupTime.value) return "";
  return new Date($pickupTime.value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

document.getElementById("review-order").addEventListener("click", () => {
  const pickupOption = document.querySelector('input[name="pickup-option"]:checked').value;
  if (pickupOption === "later" && (!$pickupTime.value || !$pickupTime.checkValidity())) {
    $pickupTime.reportValidity();
    return;
  }
  const pickupDescription = selectedPickupDescription();
  const items = [...cart.values()];
  const stall = STALLS.find((entry) => entry.id === Number(items[0].key.split(":")[0]));
  document.getElementById("review-vendor").textContent = `Pickup from ${stall.name}`;
  document.getElementById("review-pickup").textContent = `Pickup: ${pickupDescription}`;
  document.getElementById("review-total").textContent = peso(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const $reviewItems = document.getElementById("review-items");
  $reviewItems.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    const label = document.createElement("span");
    label.textContent = `${item.quantity} × ${item.name}`;
    const price = document.createElement("strong");
    price.textContent = peso(item.price * item.quantity);
    li.append(label, price);
    $reviewItems.appendChild(li);
  });
  $pickupStep.hidden = true;
  $reviewStep.hidden = false;
  document.getElementById("checkout-step-label").textContent = "2 of 2 · Review & payment";
  document.getElementById("checkout-back").hidden = false;
});

document.getElementById("checkout-back").addEventListener("click", () => {
  $reviewStep.hidden = true;
  $pickupStep.hidden = false;
  document.getElementById("checkout-step-label").textContent = "1 of 2 · Pickup";
  selectedPayment = "";
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => { radio.checked = false; });
  $vendorQr.hidden = true;
  $placeOrder.disabled = true;
});

document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    selectedPayment = radio.value;
    const item = cart.values().next().value;
    const stall = STALLS.find((entry) => entry.id === Number(item.key.split(":")[0]));
    const qrPath = stall.paymentQr && stall.paymentQr[selectedPayment];
    $vendorQr.innerHTML = "";
    const heading = document.createElement("strong");
    heading.textContent = `${selectedPayment === "gcash" ? "GCash" : "Maya"} · ${stall.name}`;
    $vendorQr.appendChild(heading);
    if (qrPath) {
      const image = document.createElement("img");
      image.src = qrPath;
      image.alt = `${selectedPayment === "gcash" ? "GCash" : "Maya"} QR code for ${stall.name}`;
      image.addEventListener("error", () => {
        image.remove();
        const error = document.createElement("p");
        error.textContent = "The vendor QR image could not be loaded. Contact the vendor for a verified payment QR.";
        $vendorQr.appendChild(error);
      }, { once: true });
      $vendorQr.appendChild(image);
    } else {
      const placeholder = document.createElement("p");
      placeholder.textContent = `This vendor's ${selectedPayment === "gcash" ? "GCash" : "Maya"} QR code has not been added yet. Ask the vendor for their verified QR before paying.`;
      $vendorQr.appendChild(placeholder);
    }
    $vendorQr.hidden = false;
    $placeOrder.disabled = false;
  });
});

$placeOrder.addEventListener("click", () => {
  if (!selectedPayment || !cart.size) return;
  const items = [...cart.values()];
  const stallId = Number(items[0].key.split(":")[0]);
  const orderTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  try {
    const savedOrders = localStorage.getItem(ORDERS_KEY);
    const orders = savedOrders ? JSON.parse(savedOrders) : [];
    if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
    orders.push({
      id: createOrderId(),
      stallId,
      createdAt: new Date().toISOString(),
      total: orderTotal,
      itemSummary: items.map((item) => `${item.quantity} × ${item.name}`).join(", "),
      payment: selectedPayment,
      paymentStatus: "unpaid",
      orderStatus: "awaiting-confirmation",
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    activeCustomerOrderId = orders[orders.length - 1].id;
  } catch (err) {
    $cartMessage.textContent = `This demo order could not be saved: ${err.message}`;
    return;
  }
  document.getElementById("order-complete-message").textContent =
    `Your demo order was sent to the vendor. Pickup: ${selectedPickupDescription()}. Payment: ${selectedPayment === "gcash" ? "GCash" : "Maya"}. This app did not collect or verify payment.`;
  document.getElementById("order-vendor-status").textContent = "Waiting for the vendor to confirm your order/payment.";
  $reviewStep.hidden = true;
  $orderComplete.hidden = false;
  document.getElementById("checkout-step-label").textContent = "Order submitted";
});

document.getElementById("new-order").addEventListener("click", () => {
  cart.clear();
  renderCart();
  $checkoutFlow.hidden = true;
  $cartContent.hidden = false;
  $cartPanel.hidden = true;
  $cartToggle.setAttribute("aria-expanded", "false");
});

// ---------- Accounts ----------
// DEMO ONLY: accounts are saved in this browser's localStorage, so they only exist on
// this computer. A real site needs a backend + database to store accounts safely
// (e.g. Firebase Auth, or Node/Express with hashed passwords on a server).
const USERS_KEY = "kainan_users";
const SESSION_KEY = "kainan_session";
const ORDERS_KEY = "kainan_demo_orders";
const ADMIN_EMAIL = "admin@iskoqueue.local";
const ADMIN_PASSWORD = "AdminDemo2026!";
const DEMO_VENDOR_EMAIL = "demo.vendor@iskoqueue.local";
const DEMO_VENDOR_PASSWORD = "VendorDemo2026!";
const DEMO_VENDOR_STALL_ID = 1;

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function currentUser() {
  try {
    let session = sessionStorage.getItem(SESSION_KEY);
    if (!session) {
      session = localStorage.getItem(SESSION_KEY);
      if (session) {
        sessionStorage.setItem(SESSION_KEY, session);
        localStorage.removeItem(SESSION_KEY);
      }
    }
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function hashPassword(password, salt) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error("Open the site with Live Server (http://localhost) to use accounts.");
  }
  const data = new TextEncoder().encode(salt + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

function createOrderId() {
  if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${randomSalt()}`;
}

async function ensureDemoVendorData() {
  const users = getUsers();
  const demoVendor = users[DEMO_VENDOR_EMAIL];
  if (!demoVendor || demoVendor.demoAccount !== true) {
    const salt = randomSalt();
    users[DEMO_VENDOR_EMAIL] = {
      name: "Demo Vendor",
      role: "vendor",
      stallId: DEMO_VENDOR_STALL_ID,
      demoAccount: true,
      salt,
      hash: await hashPassword(DEMO_VENDOR_PASSWORD, salt),
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
  }

  const storedOrders = localStorage.getItem(ORDERS_KEY);
  const orders = storedOrders ? JSON.parse(storedOrders) : [];
  if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
  let ordersChanged = false;
  orders.forEach((order) => {
    if (!order || typeof order !== "object") return;
    if (!order.id) {
      order.id = createOrderId();
      ordersChanged = true;
    }
    if (!order.orderStatus) {
      order.orderStatus = order.demoSample === true ? "confirmed" : "awaiting-confirmation";
      ordersChanged = true;
    }
    if (order.demoSample === true && order.paymentStatus !== "demo-received") {
      order.paymentStatus = "demo-received";
      ordersChanged = true;
    }
  });
  if (orders.some((order) => order && order.demoSample === true)) {
    if (ordersChanged) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return;
  }

  const now = Date.now();
  const sampleOrders = [
    { daysAgo: 0, total: 140, itemSummary: "2 × Isaw (5 sticks), 1 × Kwek-kwek (6 pcs)", payment: "gcash" },
    { daysAgo: 1, total: 95, itemSummary: "1 × Isaw (5 sticks), 2 × Fishball cup", payment: "maya" },
    { daysAgo: 2, total: 190, itemSummary: "2 × Isaw (5 sticks), 2 × Kwek-kwek (6 pcs)", payment: "gcash" },
  ];
  sampleOrders.forEach((order) => {
    orders.push({
      id: createOrderId(),
      stallId: DEMO_VENDOR_STALL_ID,
      createdAt: new Date(now - order.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      total: order.total,
      itemSummary: order.itemSummary,
      payment: order.payment,
      paymentStatus: "demo-received",
      orderStatus: "confirmed",
      demoSample: true,
    });
  });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// "Log in" button, or "Hi, Name" + "Log out" (top right of home and results pages)
function renderAccount() {
  const user = currentUser();
  ["account-home", "account-results"].forEach((id) => {
    const box = document.getElementById(id);
    box.innerHTML = "";
    if (user) {
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = "Hi, " + user.name.split(" ")[0]; // textContent keeps user input safe
      if (user.role === "admin") {
        const adminButton = document.createElement("button");
        adminButton.type = "button";
        adminButton.textContent = "Signups";
        adminButton.addEventListener("click", openAdminPanel);
        box.appendChild(adminButton);
      } else if (user.role === "vendor") {
        const vendorButton = document.createElement("button");
        vendorButton.type = "button";
        vendorButton.textContent = "Earnings";
        vendorButton.addEventListener("click", openVendorPanel);
        box.appendChild(vendorButton);
      }
      const out = document.createElement("button");
      out.type = "button";
      out.textContent = "Log out";
      out.addEventListener("click", () => {
        clearSession();
        if (user.role === "admin") {
          $adminPanel.hidden = true;
          $home.hidden = false;
        }
        renderAccount();
      });
      box.append(who, out);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Log in";
      btn.addEventListener("click", () => showAuth("login"));
      box.appendChild(btn);
    }
  });
}

const $loginForm = document.getElementById("login-form");
const $signupForm = document.getElementById("signup-form");
const $adminLoginForm = document.getElementById("admin-login-form");
const $vendorAuth = document.getElementById("vendor-auth");
const $vendorLoginForm = document.getElementById("vendor-login-form");
const $vendorSignupForm = document.getElementById("vendor-signup-form");
const $authMsg = document.getElementById("auth-msg");
const $adminUserList = document.getElementById("admin-user-list");
const $adminUserCount = document.getElementById("admin-user-count");
const $adminEmpty = document.getElementById("admin-empty");
let viewBeforeAuth = "home";

function setAuthMode(mode) {
  const login = mode === "login";
  const signup = mode === "signup";
  $loginForm.hidden = !login;
  $signupForm.hidden = !signup;
  $adminLoginForm.hidden = mode !== "admin";
  $vendorAuth.hidden = mode !== "vendor";
  $vendorLoginForm.hidden = false;
  $vendorSignupForm.hidden = true;
  document.getElementById("tab-login").setAttribute("aria-pressed", String(login));
  document.getElementById("tab-signup").setAttribute("aria-pressed", String(signup));
  document.getElementById("tab-vendor").setAttribute("aria-pressed", String(mode === "vendor"));
  document.getElementById("tab-admin").setAttribute("aria-pressed", String(mode === "admin"));
  document.getElementById("auth-title").textContent = login ? "Log in" : signup ? "Create account" : mode === "vendor" ? "Vendor access" : "Admin login";
  document.getElementById("auth-sub").textContent = login ? "Welcome back." : signup ? "Sign up to get started." : mode === "vendor" ? "Log in or create an account for your stall." : "Local demo admin access.";
  $authMsg.textContent = "";
  $authMsg.className = "form-msg";
}

function showAuth(mode = "login") {
  viewBeforeAuth = $results.hidden ? "home" : "results";
  $home.hidden = true;
  $results.hidden = true;
  $auth.hidden = false;
  setAuthMode(mode);
  const form = mode === "login" ? $loginForm : mode === "signup" ? $signupForm : mode === "admin" ? $adminLoginForm : $vendorLoginForm;
  form.querySelector("input").focus();
}

function leaveAuth() {
  $auth.hidden = true;
  if (viewBeforeAuth === "results") {
    $results.hidden = false;
    map.invalidateSize();
  } else {
    $home.hidden = false;
  }
}

function authError(msg) {
  $authMsg.textContent = msg;
  $authMsg.className = "form-msg";
}

function renderAdminUsers() {
  const users = Object.entries(getUsers())
    .filter(([, user]) => user && typeof user.name === "string")
    .sort(([, a], [, b]) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  $adminUserCount.textContent = String(users.length);
  $adminUserList.replaceChildren();
  $adminEmpty.hidden = users.length > 0;

  users.forEach(([email, user]) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const emailCell = document.createElement("td");
    const dateCell = document.createElement("td");
    nameCell.textContent = user.name;
    emailCell.textContent = email;
    const date = user.createdAt ? new Date(user.createdAt) : null;
    dateCell.textContent = date && !Number.isNaN(date.getTime())
      ? date.toLocaleString()
      : "Date unavailable";
    row.append(nameCell, emailCell, dateCell);
    $adminUserList.appendChild(row);
  });
}

function openAdminPanel() {
  renderAdminUsers();
  $home.hidden = true;
  $results.hidden = true;
  $auth.hidden = true;
  $adminPanel.hidden = false;
}

function renderVendorOrders(stallId) {
  const storedOrders = localStorage.getItem(ORDERS_KEY);
  const orders = storedOrders ? JSON.parse(storedOrders) : [];
  if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
  const vendorOrders = orders
    .filter((order) => order && Number(order.stallId) === Number(stallId) && Number.isFinite(Number(order.total)))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const total = vendorOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const receivedOrders = vendorOrders.filter((order) => order.paymentStatus === "demo-received");
  const vendorConfirmedOrders = vendorOrders.filter((order) => order.paymentStatus === "vendor-confirmed");
  const allReceivedOrders = [...receivedOrders, ...vendorConfirmedOrders];
  const receivedTotal = allReceivedOrders.reduce((sum, order) => sum + Number(order.total), 0);
  document.getElementById("vendor-sales-total").textContent = peso(total);
  document.getElementById("vendor-order-count").textContent =
    `${vendorOrders.length} submitted ${vendorOrders.length === 1 ? "order" : "orders"}`;
  document.getElementById("vendor-received-total").textContent = peso(receivedTotal);
  document.getElementById("vendor-received-count").textContent =
    `${allReceivedOrders.length} demo/vendor-confirmed ${allReceivedOrders.length === 1 ? "payment" : "payments"}`;
  const list = document.getElementById("vendor-order-list");
  const pendingList = document.getElementById("vendor-pending-list");
  const pendingOrders = vendorOrders.filter((order) => order.orderStatus !== "confirmed" && order.demoSample !== true);
  const pendingCount = document.getElementById("vendor-pending-count");
  pendingCount.textContent = String(pendingOrders.length);
  document.getElementById("vendor-pending-empty").hidden = pendingOrders.length > 0;
  pendingList.replaceChildren();
  pendingOrders.forEach((order) => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const itemsCell = document.createElement("td");
    const totalCell = document.createElement("td");
    const paymentCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const date = new Date(order.createdAt);
    dateCell.textContent = !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Date unavailable";
    itemsCell.textContent = String(order.itemSummary || "Items unavailable");
    totalCell.textContent = peso(Number(order.total));
    paymentCell.textContent = order.payment === "gcash" ? "GCash" : order.payment === "maya" ? "Maya" : "Unspecified";
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "vendor-confirm-button";
    confirmButton.textContent = "Confirm payment & order";
    confirmButton.setAttribute("aria-label", `Confirm payment and order for ${peso(Number(order.total))}`);
    confirmButton.addEventListener("click", () => confirmVendorOrder(order.id, stallId));
    actionCell.appendChild(confirmButton);
    row.append(dateCell, itemsCell, totalCell, paymentCell, actionCell);
    pendingList.appendChild(row);
  });
  list.replaceChildren();
  document.getElementById("vendor-orders-empty").hidden = vendorOrders.length > 0;
  vendorOrders.forEach((order) => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const itemsCell = document.createElement("td");
    const totalCell = document.createElement("td");
    const paymentCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const date = new Date(order.createdAt);
    dateCell.textContent = !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Date unavailable";
    itemsCell.textContent = String(order.itemSummary || "Items unavailable");
    totalCell.textContent = peso(Number(order.total));
    const paymentMethod = order.payment === "gcash" ? "GCash" : order.payment === "maya" ? "Maya" : "";
    paymentCell.textContent = order.paymentStatus === "demo-received"
      ? `Demo received · ${paymentMethod}`
      : order.paymentStatus === "vendor-confirmed"
        ? `Vendor confirmed · ${paymentMethod} (demo)`
        : `Unpaid${paymentMethod ? ` · ${paymentMethod}` : ""}`;
    statusCell.textContent = order.orderStatus === "confirmed" ? "Confirmed" : "Awaiting confirmation";
    row.append(dateCell, itemsCell, totalCell, paymentCell, statusCell);
    list.appendChild(row);
  });
}

function confirmVendorOrder(orderId, stallId) {
  try {
    const storedOrders = localStorage.getItem(ORDERS_KEY);
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
    const order = orders.find((entry) => entry && entry.id === orderId && Number(entry.stallId) === Number(stallId));
    if (!order || order.orderStatus === "confirmed") return;
    order.orderStatus = "confirmed";
    order.paymentStatus = "vendor-confirmed";
    order.confirmedAt = new Date().toISOString();
    order.confirmedBy = currentUser()?.email || "";
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    renderVendorOrders(stallId);
    document.getElementById("vendor-order-alert").textContent =
      `Confirmed ${peso(Number(order.total))} order. Payment marked vendor-confirmed in this demo only.`;
  } catch (err) {
    document.getElementById("vendor-order-alert").textContent = `Could not confirm order: ${err.message}`;
  }
}

function playVendorOrderAlert() {
  if (!vendorOrderSoundEnabled || !vendorAudioContext) return;
  const now = vendorAudioContext.currentTime;
  [0, 0.22].forEach((offset) => {
    const oscillator = vendorAudioContext.createOscillator();
    const gain = vendorAudioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = offset === 0 ? 880 : 1100;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
    oscillator.connect(gain);
    gain.connect(vendorAudioContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.2);
  });
}

function handleOrdersUpdate(oldValue, newValue) {
  if (!newValue) return;
  const user = currentUser();
  try {
    const oldOrders = oldValue ? JSON.parse(oldValue) : [];
    const newOrders = JSON.parse(newValue);
    if (!Array.isArray(oldOrders) || !Array.isArray(newOrders)) return;
    if (user && user.role === "vendor" && !$vendorPanel.hidden) {
      const previousIds = new Set(oldOrders.filter(Boolean).map((order) => order.id));
      const newVendorOrders = newOrders.filter((order) =>
        order && Number(order.stallId) === Number(user.stallId) &&
        order.orderStatus !== "confirmed" && !previousIds.has(order.id));
      renderVendorOrders(user.stallId);
      if (newVendorOrders.length) {
        const pending = newOrders.filter((order) =>
          order && Number(order.stallId) === Number(user.stallId) && order.orderStatus !== "confirmed");
        document.getElementById("vendor-order-alert").textContent =
          `New order received! ${pending.length} ${pending.length === 1 ? "order is" : "orders are"} waiting for confirmation.`;
        playVendorOrderAlert();
      }
    }
    if (activeCustomerOrderId) {
      const order = newOrders.find((entry) => entry && entry.id === activeCustomerOrderId);
      if (order) {
        document.getElementById("order-vendor-status").textContent = order.orderStatus === "confirmed"
          ? "Vendor confirmed your order and marked payment as received in this demo."
          : "Waiting for the vendor to confirm your order/payment.";
      }
    }
  } catch (err) {
    if (user && user.role === "vendor" && !$vendorPanel.hidden) {
      document.getElementById("vendor-order-alert").textContent = `Could not refresh orders: ${err.message}`;
    }
  }
}

let lastOrdersSnapshot = localStorage.getItem(ORDERS_KEY);

window.addEventListener("storage", (event) => {
  if (event.key !== ORDERS_KEY) return;
  lastOrdersSnapshot = event.newValue;
  handleOrdersUpdate(event.oldValue, event.newValue);
});

window.setInterval(() => {
  try {
    const currentSnapshot = localStorage.getItem(ORDERS_KEY);
    if (currentSnapshot === lastOrdersSnapshot) return;
    const previousSnapshot = lastOrdersSnapshot;
    lastOrdersSnapshot = currentSnapshot;
    handleOrdersUpdate(previousSnapshot, currentSnapshot);
  } catch (err) {
    const user = currentUser();
    if (user && user.role === "vendor" && !$vendorPanel.hidden) {
      document.getElementById("vendor-order-alert").textContent = `Could not refresh orders: ${err.message}`;
    }
  }
}, 1200);

function openVendorPanel() {
  const user = currentUser();
  const stall = user && user.role === "vendor"
    ? STALLS.find((entry) => entry.id === Number(user.stallId))
    : null;
  if (!stall) {
    clearSession();
    renderAccount();
    showAuth("vendor");
    authError("This vendor account is not linked to a valid stall. Please log in again or contact the site administrator.");
    return;
  }
  try {
    document.getElementById("vendor-stall-name").textContent = stall.name;
    renderVendorOrders(stall.id);
  } catch (err) {
    $home.hidden = true;
    $results.hidden = true;
    $adminPanel.hidden = true;
    $vendorPanel.hidden = true;
    $auth.hidden = false;
    setAuthMode("vendor");
    authError(`Could not load vendor orders: ${err.message}`);
    return;
  }
  $home.hidden = true;
  $results.hidden = true;
  $auth.hidden = true;
  $adminPanel.hidden = true;
  $vendorPanel.hidden = false;
}

function enterSignedInUser(user, email) {
  saveSession({
    name: user.name,
    email,
    role: user.role || "customer",
    stallId: user.stallId,
  });
  renderAccount();
  if (user.role === "vendor") openVendorPanel();
  else leaveAuth();
}

$loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    const user = getUsers()[email];
    const ok = user && (await hashPassword(password, user.salt)) === user.hash;
    if (!ok) return authError("Incorrect email or password.");

    if (user.role === "vendor") {
      if (!Number.isInteger(Number(user.stallId)) || !STALLS.some((stall) => stall.id === Number(user.stallId))) {
        return authError("This vendor account is not linked to a valid stall.");
      }
    }
    $loginForm.reset();
    enterSignedInUser(user, email);
  } catch (err) {
    authError(err.message);
  }
});

$signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const password = document.getElementById("signup-password").value;

    const users = getUsers();
    if (email === ADMIN_EMAIL || email === DEMO_VENDOR_EMAIL) return authError("That email is reserved.");
    if (users[email]) return authError("That email already has an account. Try logging in.");

    const salt = randomSalt();
    users[email] = { name, role: "customer", salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
    saveUsers(users);

    $signupForm.reset();
    enterSignedInUser(users[email], email);
  } catch (err) {
    authError(err.message);
  }
});

$vendorLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById("vendor-login-email").value.trim().toLowerCase();
    const password = document.getElementById("vendor-login-password").value;
    const user = getUsers()[email];
    const ok = user && user.role === "vendor" && (await hashPassword(password, user.salt)) === user.hash;
    if (!ok) return authError("Incorrect vendor email or password.");
    if (!STALLS.some((stall) => stall.id === Number(user.stallId))) {
      return authError("This vendor account is not linked to a valid stall.");
    }
    $vendorLoginForm.reset();
    enterSignedInUser(user, email);
  } catch (err) {
    authError(err.message);
  }
});

$vendorSignupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById("vendor-signup-name").value.trim();
    const email = document.getElementById("vendor-signup-email").value.trim().toLowerCase();
    const password = document.getElementById("vendor-signup-password").value;
    const stallId = Number(document.getElementById("vendor-signup-stall").value);
    const users = getUsers();
    if (email === ADMIN_EMAIL || email === DEMO_VENDOR_EMAIL) return authError("That email is reserved.");
    if (users[email]) return authError("That email already has an account. Try logging in.");
    if (!STALLS.some((stall) => stall.id === stallId)) return authError("Choose a valid stall.");

    const salt = randomSalt();
    users[email] = {
      name,
      role: "vendor",
      stallId,
      salt,
      hash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
    $vendorSignupForm.reset();
    enterSignedInUser(users[email], email);
  } catch (err) {
    authError(err.message);
  }
});

$adminLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value.trim().toLowerCase();
  const password = document.getElementById("admin-password").value;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return authError("Incorrect admin email or password.");
  }

  saveSession({ name: "Administrator", email, role: "admin" });
  $adminLoginForm.reset();
  renderAccount();
  openAdminPanel();
});

document.getElementById("admin-back").addEventListener("click", () => {
  $adminPanel.hidden = true;
  $home.hidden = false;
  renderAccount();
});

document.getElementById("admin-logout").addEventListener("click", () => {
  clearSession();
  $adminPanel.hidden = true;
  showAuth("login");
  renderAccount();
});

document.getElementById("vendor-back").addEventListener("click", () => {
  $vendorPanel.hidden = true;
  $home.hidden = false;
});

document.getElementById("vendor-logout").addEventListener("click", () => {
  clearSession();
  $vendorPanel.hidden = true;
  renderAccount();
  showAuth("vendor");
});

document.getElementById("vendor-sound-toggle").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Order sounds are not supported in this browser.");
    if (!vendorAudioContext) vendorAudioContext = new AudioContextClass();
    if (vendorAudioContext.state === "suspended") await vendorAudioContext.resume();
    vendorOrderSoundEnabled = !vendorOrderSoundEnabled;
    button.setAttribute("aria-pressed", String(vendorOrderSoundEnabled));
    button.textContent = vendorOrderSoundEnabled ? "Order sound on" : "Enable order sound";
    document.getElementById("vendor-order-alert").textContent = vendorOrderSoundEnabled
      ? "Order sound enabled. Keep this vendor dashboard open for new-order alerts."
      : "Order sound disabled.";
    if (vendorOrderSoundEnabled) playVendorOrderAlert();
  } catch (err) {
    document.getElementById("vendor-order-alert").textContent = err.message;
  }
});

document.getElementById("tab-login").addEventListener("click", () => setAuthMode("login"));
document.getElementById("tab-signup").addEventListener("click", () => setAuthMode("signup"));
document.getElementById("tab-vendor").addEventListener("click", () => setAuthMode("vendor"));
document.getElementById("tab-admin").addEventListener("click", () => setAuthMode("admin"));
document.getElementById("vendor-show-signup").addEventListener("click", () => {
  $vendorLoginForm.hidden = true;
  $vendorSignupForm.hidden = false;
  $vendorSignupForm.querySelector("input").focus();
  $authMsg.textContent = "";
});
document.getElementById("vendor-show-login").addEventListener("click", () => {
  $vendorSignupForm.hidden = true;
  $vendorLoginForm.hidden = false;
  $vendorLoginForm.querySelector("input").focus();
  $authMsg.textContent = "";
});

const $vendorStallSelect = document.getElementById("vendor-signup-stall");
STALLS.forEach((stall) => {
  const option = document.createElement("option");
  option.value = String(stall.id);
  option.textContent = stall.name;
  $vendorStallSelect.appendChild(option);
});

// ---------- Start ----------
async function startApp() {
  renderHome();
  renderAccount();
  renderCart();
  try {
    await ensureDemoVendorData();
  } catch (err) {
    authError(`Demo vendor data could not be initialized: ${err.message}`);
  }
  const startupUser = currentUser();
  if (startupUser && startupUser.role === "admin") {
    openAdminPanel();
  } else if (startupUser && startupUser.role === "vendor") {
    openVendorPanel();
  } else if (startupUser) {
  $home.hidden = false;
  $craveInput.focus();
  } else {
    $auth.hidden = false;
    setAuthMode("login");
    document.getElementById("login-email").focus();
  }
}

startApp();
