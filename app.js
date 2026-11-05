// ---------- State ----------
let activeCategory = "All";
let query = "";
let currentDetailStall = null;

// ---------- Elements ----------
const $cards = document.getElementById("cards");
const $count = document.getElementById("count");
const $chips = document.getElementById("chips");
const $search = document.getElementById("search");
const $listView = document.getElementById("list-view");
const $detailView = document.getElementById("detail-view");
const $home = document.getElementById("home");
const $results = document.getElementById("results");
const $profilePage = document.getElementById("profile-page");
const $bottomNav = document.getElementById("bottom-nav");
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
  if (typeof stall.manualOpen === "boolean") return stall.manualOpen;
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
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

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
            <div class="dish">${escapeHTML(m.name)}</div>
            ${m.desc ? `<div class="desc">${escapeHTML(m.desc)}</div>` : ""}
          </div>
          <div class="menu-buy">
            <div class="price">${peso(m.price)}</div>
            <div class="menu-quantity-controls" aria-label="Quantity for ${escapeHTML(m.name)}">
              <button class="menu-quantity-button menu-quantity-decrease" type="button" data-item="${index}" aria-label="Decrease ${escapeHTML(m.name)} quantity" disabled>−</button>
              <span class="menu-quantity" data-quantity-for="${index}" aria-live="polite">0</span>
              <button class="menu-quantity-button menu-quantity-increase add-to-cart" type="button" data-item="${index}" aria-label="Increase ${escapeHTML(m.name)} quantity"${open ? "" : " disabled"}>+</button>
            </div>
          </div>
        </li>`
        )
        .join("")}
    </ul>`;

  $detailView.querySelector(".back").addEventListener("click", showList);
  $detailView.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => addToCart(stall, stall.menu[Number(button.dataset.item)]));
  });
  $detailView.querySelectorAll(".menu-quantity-decrease").forEach((button) => {
    button.addEventListener("click", () => {
      const item = stall.menu[Number(button.dataset.item)];
      const current = cart.get(`${stall.id}:${item.name}`)?.quantity || 0;
      setCartItemQuantity(stall, item, current - 1);
    });
  });

  currentDetailStall = stall;
  $listView.hidden = true;
  $detailView.hidden = false;
  updateMenuQuantities();
  document.getElementById("panel").scrollTop = 0;

  // zoom the map to this stall
  map.flyTo([stall.lat, stall.lng], 18, { duration: 0.8 });
}

function showList() {
  currentDetailStall = null;
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
  $profilePage.hidden = true;
  $detailView.hidden = true;
  $listView.hidden = false;

  map.invalidateSize(); // the map was hidden, so tell Leaflet its real size
  renderChips();
  renderList();
  updateCustomerChrome("search");
  window.scrollTo(0, 0);
}

function showHome() {
  $results.hidden = true;
  $auth.hidden = true;
  $profilePage.hidden = true;
  $home.hidden = false;
  $craveInput.value = "";
  updateCustomerChrome("home");
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
const $cartDock = document.getElementById("cart-dock");
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
  const key = `${stall.id}:${item.name}`;
  setCartItemQuantity(stall, item, (cart.get(key)?.quantity || 0) + 1);
}

function setCartItemQuantity(stall, item, quantity) {
  const key = `${stall.id}:${item.name}`;
  const existing = cart.get(key);
  if (quantity <= 0) {
    cart.delete(key);
    $cartMessage.textContent = `${item.name} removed from your cart.`;
    $cartContent.hidden = false;
    $checkoutFlow.hidden = true;
    renderCart();
    return;
  }
  if (!Number.isInteger(quantity)) {
    $cartMessage.textContent = "Enter a whole number quantity of at least 1.";
    renderCart();
    return;
  }
  if (quantity > (existing?.quantity || 0) && !isOpenNow(stall)) {
    $cartMessage.textContent = `${stall.name} is closed right now and cannot accept orders.`;
    $cartPanel.hidden = false;
    $cartToggle.setAttribute("aria-expanded", "true");
    renderCart();
    return;
  }
  const currentStallId = cart.size ? Number([...cart.keys()][0].split(":")[0]) : null;
  if (quantity > 0 && currentStallId !== null && currentStallId !== stall.id) {
    $cartMessage.textContent = "Checkout is one stall at a time. Remove the current stall's items before adding from another stall.";
    $cartPanel.hidden = false;
    $cartToggle.setAttribute("aria-expanded", "true");
    return;
  }
  cart.set(key, {
    key,
    stallName: stall.name,
    name: item.name,
    price: item.price,
    quantity,
  });
  $cartMessage.textContent = `${item.name} quantity updated to ${quantity}.`;
  $cartContent.hidden = false;
  $checkoutFlow.hidden = true;
  renderCart();
}

function updateMenuQuantities() {
  if (!currentDetailStall || $detailView.hidden) return;
  currentDetailStall.menu.forEach((item, index) => {
    const quantity = cart.get(`${currentDetailStall.id}:${item.name}`)?.quantity || 0;
    const quantityLabel = $detailView.querySelector(`[data-quantity-for="${index}"]`);
    const decrease = $detailView.querySelector(`.menu-quantity-decrease[data-item="${index}"]`);
    if (quantityLabel) quantityLabel.textContent = String(quantity);
    if (decrease) decrease.disabled = quantity === 0;
  });
}

function renderCart() {
  const items = [...cart.values()];
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $cartCount.textContent = String(quantity);
  document.getElementById("nav-cart-count").textContent = String(quantity);
  $cartTotal.textContent = peso(total);
  $cartItems.innerHTML = "";
  $cartEmpty.hidden = items.length > 0;
  $cartCheckout.disabled = items.length === 0;
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    const detail = document.createElement("span");
    detail.className = "cart-item-detail";
    detail.textContent = `${item.name} · ${item.stallName}`;
    const price = document.createElement("strong");
    price.textContent = peso(item.price * item.quantity);
    const quantityControls = document.createElement("div");
    quantityControls.className = "cart-quantity-controls";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.className = "cart-quantity-button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Decrease quantity of ${item.name}`);
    decrease.addEventListener("click", () => {
      const stall = STALLS.find((entry) => entry.id === Number(item.key.split(":")[0]));
      if (stall) setCartItemQuantity(stall, stall.menu.find((menuItem) => menuItem.name === item.name), item.quantity - 1);
    });
    const quantityInput = document.createElement("input");
    quantityInput.className = "cart-quantity-input";
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.value = String(item.quantity);
    quantityInput.setAttribute("aria-label", `Quantity of ${item.name}`);
    quantityInput.addEventListener("change", () => {
      const quantity = Number(quantityInput.value);
      if (!Number.isInteger(quantity) || quantity < 1) {
        $cartMessage.textContent = "Enter a whole number quantity of at least 1.";
        renderCart();
        return;
      }
      const stall = STALLS.find((entry) => entry.id === Number(item.key.split(":")[0]));
      if (stall) setCartItemQuantity(stall, stall.menu.find((menuItem) => menuItem.name === item.name), quantity);
    });
    const increase = document.createElement("button");
    increase.type = "button";
    increase.className = "cart-quantity-button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Increase quantity of ${item.name}`);
    increase.addEventListener("click", () => {
      const stall = STALLS.find((entry) => entry.id === Number(item.key.split(":")[0]));
      if (stall) setCartItemQuantity(stall, stall.menu.find((menuItem) => menuItem.name === item.name), item.quantity + 1);
    });
    quantityControls.append(decrease, quantityInput, increase);
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
    li.append(detail, price, quantityControls, remove);
    $cartItems.appendChild(li);
  });
  updateMenuQuantities();
}

function setActiveNav(name) {
  $bottomNav.querySelectorAll("[data-nav]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.nav === name));
  });
}

function updateCustomerChrome(activeNav = "") {
  const user = currentUser();
  const customerPageVisible = !$home.hidden || !$results.hidden || !$profilePage.hidden;
  const enabled = customerPageVisible && (!user || user.role === "customer");
  $bottomNav.hidden = !enabled;
  $cartDock.hidden = !enabled;
  document.body.classList.toggle("has-bottom-nav", enabled);
  renderFloatingOrderStatus();
  if (!enabled) {
    $cartPanel.hidden = true;
    $cartToggle.setAttribute("aria-expanded", "false");
    return;
  }
  if (activeNav) {
    if (activeNav !== "cart") {
      $cartPanel.hidden = true;
      $cartToggle.setAttribute("aria-expanded", "false");
    }
    setActiveNav(activeNav);
  }
}

function showProfile() {
  const user = currentUser();
  if (!user || user.role !== "customer") {
    showAuth("login");
    viewBeforeAuth = "profile";
    return;
  }
  $home.hidden = true;
  $results.hidden = true;
  $auth.hidden = true;
  $profilePage.hidden = false;
  renderProfile();
  updateCustomerChrome("profile");
  window.scrollTo(0, 0);
}

$bottomNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-nav]");
  if (!button) return;
  switch (button.dataset.nav) {
    case "home":
      showHome();
      break;
    case "search":
      showResults();
      setActiveNav("search");
      $search.focus();
      break;
    case "map":
      showResults();
      setActiveNav("map");
      map.invalidateSize();
      document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    case "cart": {
      const willOpen = $cartPanel.hidden;
      $cartPanel.hidden = !willOpen;
      $cartToggle.setAttribute("aria-expanded", String(willOpen));
      setActiveNav(willOpen ? "cart" : "");
      break;
    }
    case "profile":
      showProfile();
      break;
  }
});

$cartToggle.addEventListener("click", () => {
  const willOpen = $cartPanel.hidden;
  $cartPanel.hidden = !willOpen;
  $cartToggle.setAttribute("aria-expanded", String(willOpen));
});
document.getElementById("cart-close").addEventListener("click", () => {
  $cartPanel.hidden = true;
  $cartToggle.setAttribute("aria-expanded", "false");
  setActiveNav("");
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
  const preferredPayment = preferredPaymentForCurrentUser();
  if (preferredPayment) {
    const preferredRadio = document.querySelector(`input[name="payment-method"][value="${preferredPayment}"]`);
    if (preferredRadio) {
      preferredRadio.checked = true;
      preferredRadio.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
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
  const stall = STALLS.find((entry) => entry.id === stallId);
  if (!stall || !isOpenNow(stall)) {
    $cartMessage.textContent = `${stall ? stall.name : "This shop"} is closed and cannot accept orders right now.`;
    return;
  }
  const orderTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  try {
    const savedOrders = localStorage.getItem(ORDERS_KEY);
    const orders = savedOrders ? JSON.parse(savedOrders) : [];
    if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
    orders.push({
      id: createOrderId(),
      stallId,
      customerEmail: currentUser()?.email || "",
      createdAt: new Date().toISOString(),
      total: orderTotal,
      itemSummary: items.map((item) => `${item.quantity} × ${item.name}`).join(", "),
      payment: selectedPayment,
      pickupDescription: selectedPickupDescription(),
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
  document.getElementById("order-vendor-status").textContent = "Status: Awaiting Confirmation · Waiting for the vendor to confirm your order/payment.";
  $reviewStep.hidden = true;
  $orderComplete.hidden = false;
  document.getElementById("checkout-step-label").textContent = "Order submitted";
  renderFloatingOrderStatus();
});

document.getElementById("new-order").addEventListener("click", () => {
  cart.clear();
  renderCart();
  $checkoutFlow.hidden = true;
  $cartContent.hidden = false;
  $cartPanel.hidden = true;
  $cartToggle.setAttribute("aria-expanded", "false");
  setActiveNav("");
});

document.getElementById("floating-order-history").addEventListener("click", showProfile);

// ---------- Accounts ----------
// DEMO ONLY: accounts are saved in this browser's localStorage, so they only exist on
// this computer. A real site needs a backend + database to store accounts safely
// (e.g. Firebase Auth, or Node/Express with hashed passwords on a server).
const USERS_KEY = "kainan_users";
const SESSION_KEY = "kainan_session";
const ORDERS_KEY = "kainan_demo_orders";
const VENDOR_MENUS_KEY = "kainan_vendor_menus";
const VENDOR_SHOP_STATUS_KEY = "kainan_vendor_shop_status";
const ADMIN_EMAIL = "admin@iskoqueue.local";
const ADMIN_PASSWORD = "AdminDemo2026!";
const DEMO_VENDOR_EMAIL = "demo.vendor@iskoqueue.local";
const DEMO_VENDOR_PASSWORD = "VendorDemo2026!";
const DEMO_VENDOR_STALL_ID = 1;
const ORDER_STATUSES = [
  { id: "awaiting-confirmation", label: "Awaiting Confirmation" },
  { id: "preparing", label: "Preparing" },
  { id: "ready-for-pickup", label: "Ready for Pickup" },
  { id: "completed", label: "Completed" },
];
const ORIGINAL_STALL_MENUS = new Map(STALLS.map((stall) => [
  stall.id,
  stall.menu.map((item) => ({ ...item })),
]));
let vendorMenus = {};
let vendorShopStatus = {};
let vendorSettingsLoaded = false;

function readVendorSettingsObject(key) {
  const saved = localStorage.getItem(key);
  if (!saved) return {};
  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved vendor settings are invalid.");
  }
  return parsed;
}

function loadVendorSettings() {
  const savedMenus = readVendorSettingsObject(VENDOR_MENUS_KEY);
  const savedStatuses = readVendorSettingsObject(VENDOR_SHOP_STATUS_KEY);
  const nextMenus = {};
  const nextStatuses = {};
  Object.entries(savedMenus).forEach(([stallId, menu]) => {
    if (!Array.isArray(menu) || !menu.length || menu.some((item) =>
      !item || typeof item.name !== "string" || !item.name.trim() ||
      typeof item.desc !== "string" || !Number.isFinite(item.price) || item.price < 0
    )) {
      throw new Error("Saved vendor menu is invalid.");
    }
    nextMenus[stallId] = menu.map((item) => ({
      name: item.name.trim(),
      desc: item.desc.trim(),
      price: item.price,
    }));
  });
  Object.entries(savedStatuses).forEach(([stallId, isOpen]) => {
    if (typeof isOpen !== "boolean") throw new Error("Saved shop status is invalid.");
    nextStatuses[stallId] = isOpen;
  });
  vendorMenus = nextMenus;
  vendorShopStatus = nextStatuses;
  STALLS.forEach((stall) => {
    stall.menu = (vendorMenus[stall.id] || ORIGINAL_STALL_MENUS.get(stall.id)).map((item) => ({ ...item }));
    stall.manualOpen = Object.prototype.hasOwnProperty.call(vendorShopStatus, stall.id)
      ? vendorShopStatus[stall.id]
      : undefined;
  });
  vendorSettingsLoaded = true;
}

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

function preferredPaymentForCurrentUser() {
  const user = currentUser();
  const savedUser = user && getUsers()[user.email];
  if (!savedUser || !["gcash", "maya"].includes(savedUser.preferredPayment)) return "";
  return savedUser.preferredPayment;
}

function renderProfile() {
  const user = currentUser();
  if (!user || user.role !== "customer") return;
  document.getElementById("profile-name").textContent = user.name || "Customer";
  document.getElementById("profile-email").textContent = user.email || "";

  const preferredPayment = preferredPaymentForCurrentUser();
  const paymentList = document.getElementById("profile-payment-methods");
  paymentList.replaceChildren();
  [
    { id: "gcash", label: "GCash" },
    { id: "maya", label: "Maya" },
  ].forEach((method) => {
    const row = document.createElement("div");
    row.className = "profile-payment-row";
    const description = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = method.label;
    const status = document.createElement("span");
    status.className = "profile-payment-status";
    status.textContent = preferredPayment === method.id
      ? "Preferred · not connected"
      : "Not connected";
    description.append(name, status);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "profile-payment-button";
    button.textContent = preferredPayment === method.id ? "Preferred" : "Set preferred";
    button.disabled = preferredPayment === method.id;
    button.addEventListener("click", () => {
      const users = getUsers();
      const savedUser = users[user.email];
      if (!savedUser || savedUser.role !== "customer") {
        document.getElementById("profile-payment-feedback").textContent =
          "Could not save your preference. Please log in again.";
        return;
      }
      savedUser.preferredPayment = method.id;
      try {
        saveUsers(users);
        document.getElementById("profile-payment-feedback").textContent =
          `${method.label} saved as your preferred checkout method. No e-wallet was connected.`;
        renderProfile();
      } catch (err) {
        document.getElementById("profile-payment-feedback").textContent =
          `Could not save your preference: ${err.message}`;
      }
    });
    row.append(description, button);
    paymentList.appendChild(row);
  });

  const orderList = document.getElementById("profile-orders");
  orderList.replaceChildren();
  const orderStatus = document.createElement("p");
  orderStatus.className = "profile-note";
  try {
    const storedOrders = localStorage.getItem(ORDERS_KEY);
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
    const customerOrders = orders
      .filter((order) => order && order.customerEmail === user.email)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    if (!customerOrders.length) {
      orderStatus.textContent = "No orders linked to this account yet. New orders will appear here.";
      orderList.appendChild(orderStatus);
      return;
    }
    customerOrders.forEach((order) => {
      const card = document.createElement("article");
      card.className = "profile-order";
      const stall = STALLS.find((entry) => entry.id === Number(order.stallId));
      const heading = document.createElement("h3");
      heading.textContent = stall ? stall.name : "Food stall";
      const details = document.createElement("p");
      details.textContent = String(order.itemSummary || "Items unavailable");
      const date = new Date(order.createdAt);
      const meta = document.createElement("p");
      const dateLabel = !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Date unavailable";
      const payment = order.payment === "gcash" ? "GCash" : order.payment === "maya" ? "Maya" : "Unspecified";
      meta.textContent = `${dateLabel} · ${peso(Number(order.total) || 0)} · ${payment}`;
      const pickup = document.createElement("p");
      pickup.textContent = `Pickup: ${String(order.pickupDescription || "Schedule unavailable")}`;
      const tracking = document.createElement("p");
      tracking.className = "profile-order-status";
      tracking.textContent = orderTrackingText(order);
      card.append(heading, details, meta, pickup, tracking);
      orderList.appendChild(card);
    });
  } catch (err) {
    orderStatus.textContent = `Order history could not be loaded: ${err.message}`;
    orderList.appendChild(orderStatus);
  }
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

function createQueueNumber(orders) {
  const existing = new Set(orders.map((order) => order && order.queueNumber).filter(Boolean));
  let number = 1;
  while (existing.has(`Q${String(number).padStart(4, "0")}`)) number += 1;
  return `Q${String(number).padStart(4, "0")}`;
}

function orderStatusLabel(order) {
  const status = order && order.orderStatus === "confirmed" ? "preparing" : order && order.orderStatus;
  return ORDER_STATUSES.find((entry) => entry.id === status)?.label || "Awaiting Confirmation";
}

function orderTrackingText(order) {
  const status = orderStatusLabel(order);
  if (order && order.queueNumber) return `Status: ${status} · Queue number: ${order.queueNumber}`;
  return status === "Awaiting Confirmation"
    ? `Status: ${status} · Waiting for the vendor to confirm your order.`
    : `Status: ${status}`;
}

function renderFloatingOrderStatus() {
  const notification = document.getElementById("floating-order-status");
  const user = currentUser();
  const customerPageVisible = !$home.hidden || !$results.hidden || !$profilePage.hidden;
  if (!user || user.role !== "customer" || !customerPageVisible) {
    notification.hidden = true;
    return;
  }

  try {
    const storedOrders = localStorage.getItem(ORDERS_KEY);
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
    const order = orders
      .filter((entry) => entry && entry.customerEmail === user.email && entry.orderStatus !== "completed")
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
    if (!order) {
      notification.hidden = true;
      return;
    }

    const stall = STALLS.find((entry) => entry.id === Number(order.stallId));
    document.getElementById("floating-order-stall").textContent = stall ? stall.name : "Your food stall";
    document.getElementById("floating-order-items").textContent = String(order.itemSummary || "Order items");
    document.getElementById("floating-order-stage").textContent = orderStatusLabel(order);
    const queue = document.getElementById("floating-order-queue");
    queue.hidden = !order.queueNumber;
    queue.textContent = order.queueNumber ? `Queue number · ${order.queueNumber}` : "";
    notification.hidden = false;
  } catch (err) {
    notification.hidden = false;
    document.getElementById("floating-order-stall").textContent = "Order status unavailable";
    document.getElementById("floating-order-items").textContent = `Could not load your order: ${err.message}`;
    document.getElementById("floating-order-stage").textContent = "";
    document.getElementById("floating-order-queue").hidden = true;
  }
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
      order.orderStatus = order.demoSample === true ? "completed" : "awaiting-confirmation";
      ordersChanged = true;
    }
    if (order.orderStatus === "confirmed") {
      order.orderStatus = order.demoSample === true ? "completed" : "preparing";
      ordersChanged = true;
    }
    if (order.orderStatus !== "awaiting-confirmation" && !order.queueNumber && order.demoSample !== true) {
      order.queueNumber = createQueueNumber(orders);
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
      orderStatus: "completed",
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
        if (user.role === "admin" || user.role === "vendor") {
          $adminPanel.hidden = true;
          $vendorPanel.hidden = true;
          $home.hidden = false;
        }
        renderAccount();
        showHome();
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
const $resetPasswordForm = document.getElementById("reset-password-form");
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
let passwordResetReturnMode = "login";

function setAuthMode(mode) {
  const login = mode === "login";
  const signup = mode === "signup";
  const reset = mode === "forgot";
  $loginForm.hidden = !login;
  $resetPasswordForm.hidden = !reset;
  $signupForm.hidden = !signup;
  $adminLoginForm.hidden = mode !== "admin";
  $vendorAuth.hidden = mode !== "vendor";
  $vendorLoginForm.hidden = false;
  $vendorSignupForm.hidden = true;
  document.getElementById("tab-login").setAttribute("aria-pressed", String(login));
  document.getElementById("tab-signup").setAttribute("aria-pressed", String(signup));
  document.getElementById("tab-vendor").setAttribute("aria-pressed", String(mode === "vendor"));
  document.getElementById("tab-admin").setAttribute("aria-pressed", String(mode === "admin"));
  document.getElementById("auth-title").textContent = login ? "Log in" : signup ? "Create account" : reset ? "Reset password" : mode === "vendor" ? "Vendor access" : "Admin login";
  document.getElementById("auth-sub").textContent = login ? "Welcome back." : signup ? "Sign up to get started." : reset ? "Update a password for an account saved in this browser." : mode === "vendor" ? "Log in or create an account for your stall." : "Local demo admin access.";
  $authMsg.textContent = "";
  $authMsg.className = "form-msg";
}

function showAuth(mode = "login") {
  viewBeforeAuth = $results.hidden ? "home" : "results";
  $home.hidden = true;
  $results.hidden = true;
  $profilePage.hidden = true;
  $auth.hidden = false;
  setAuthMode(mode);
  updateCustomerChrome();
  const form = mode === "login" ? $loginForm : mode === "signup" ? $signupForm : mode === "forgot" ? $resetPasswordForm : mode === "admin" ? $adminLoginForm : $vendorLoginForm;
  form.querySelector("input").focus();
}

function leaveAuth() {
  $auth.hidden = true;
  if (viewBeforeAuth === "results") {
    $results.hidden = false;
    $profilePage.hidden = true;
    map.invalidateSize();
    updateCustomerChrome("search");
  } else if (viewBeforeAuth === "profile") {
    $home.hidden = true;
    $results.hidden = true;
    $profilePage.hidden = false;
    renderProfile();
    updateCustomerChrome("profile");
  } else {
    $results.hidden = true;
    $profilePage.hidden = true;
    $home.hidden = false;
    updateCustomerChrome("home");
  }
}

function authError(msg) {
  $authMsg.textContent = msg;
  $authMsg.className = "form-msg";
}

function showPasswordReset() {
  passwordResetReturnMode = $vendorAuth.hidden ? "login" : "vendor";
  setAuthMode("forgot");
  document.getElementById("reset-email").focus();
}

document.getElementById("show-reset-form").addEventListener("click", showPasswordReset);
document.getElementById("vendor-show-reset").addEventListener("click", showPasswordReset);
document.getElementById("reset-back-login").addEventListener("click", () => setAuthMode(passwordResetReturnMode));

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
  $profilePage.hidden = true;
  $adminPanel.hidden = false;
  updateCustomerChrome();
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
  const pendingOrders = vendorOrders.filter((order) =>
    order.orderStatus !== "completed" && order.demoSample !== true);
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
    const statusCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const date = new Date(order.createdAt);
    dateCell.textContent = !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Date unavailable";
    itemsCell.textContent = String(order.itemSummary || "Items unavailable");
    totalCell.textContent = peso(Number(order.total));
    paymentCell.textContent = order.payment === "gcash" ? "GCash" : order.payment === "maya" ? "Maya" : "Unspecified";
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "vendor-confirm-button";
    const nextAction = {
      "awaiting-confirmation": "Confirm & start preparing",
      preparing: "Mark ready for pickup",
      "ready-for-pickup": "Mark completed",
    }[order.orderStatus] || "Update order";
    confirmButton.textContent = nextAction;
    confirmButton.setAttribute("aria-label", `${nextAction} for ${peso(Number(order.total))}`);
    confirmButton.addEventListener("click", () => advanceVendorOrder(order.id, stallId));
    statusCell.textContent = orderTrackingText(order);
    actionCell.appendChild(confirmButton);
    row.append(dateCell, itemsCell, totalCell, paymentCell, statusCell, actionCell);
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
    statusCell.textContent = orderTrackingText(order);
    row.append(dateCell, itemsCell, totalCell, paymentCell, statusCell);
    list.appendChild(row);
  });
}

function advanceVendorOrder(orderId, stallId) {
  try {
    const storedOrders = localStorage.getItem(ORDERS_KEY);
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    if (!Array.isArray(orders)) throw new Error("Saved order data is invalid.");
    const order = orders.find((entry) => entry && entry.id === orderId && Number(entry.stallId) === Number(stallId));
    if (!order || order.orderStatus === "completed" || order.demoSample === true) return;
    const statusIndex = ORDER_STATUSES.findIndex((entry) => entry.id === order.orderStatus);
    if (statusIndex < 0 || statusIndex >= ORDER_STATUSES.length - 1) {
      throw new Error("This order has an invalid status.");
    }
    const previousStatus = order.orderStatus;
    order.orderStatus = ORDER_STATUSES[statusIndex + 1].id;
    order.statusUpdatedAt = new Date().toISOString();
    if (previousStatus === "awaiting-confirmation") {
      order.queueNumber = order.queueNumber || createQueueNumber(orders);
      order.paymentStatus = "vendor-confirmed";
      order.confirmedAt = order.statusUpdatedAt;
      order.confirmedBy = currentUser()?.email || "";
    }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    renderVendorOrders(stallId);
    document.getElementById("vendor-order-alert").textContent =
      `Order updated to ${orderStatusLabel(order)}${order.queueNumber ? ` · Queue number ${order.queueNumber}` : ""}.`;
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
        order.orderStatus === "awaiting-confirmation" && !previousIds.has(order.id));
      renderVendorOrders(user.stallId);
      if (newVendorOrders.length) {
        const pending = newOrders.filter((order) =>
          order && Number(order.stallId) === Number(user.stallId) &&
          order.orderStatus === "awaiting-confirmation");
        document.getElementById("vendor-order-alert").textContent =
          `New order received! ${pending.length} ${pending.length === 1 ? "order is" : "orders are"} waiting for confirmation.`;
        playVendorOrderAlert();
      }
    }
    if (activeCustomerOrderId) {
      const order = newOrders.find((entry) => entry && entry.id === activeCustomerOrderId);
      if (order) {
        document.getElementById("order-vendor-status").textContent = orderTrackingText(order);
      }
    }
    renderFloatingOrderStatus();
    if (user && user.role === "customer" && !$profilePage.hidden) renderProfile();
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

window.addEventListener("storage", (event) => {
  if (event.key !== VENDOR_MENUS_KEY && event.key !== VENDOR_SHOP_STATUS_KEY) return;
  try {
    loadVendorSettings();
    const user = currentUser();
    const stall = user && user.role === "vendor"
      ? STALLS.find((entry) => entry.id === Number(user.stallId))
      : null;
    if (stall && !$vendorPanel.hidden) renderVendorMenu(stall);
    if (!$results.hidden) {
      if ($detailView.hidden) renderList();
      else {
        const detailStall = STALLS.find((entry) => entry.name === $detailView.querySelector("h2")?.textContent);
        if (detailStall) showDetail(detailStall);
      }
    }
  } catch (err) {
    document.getElementById("vendor-menu-feedback").textContent = `Could not refresh vendor settings: ${err.message}`;
  }
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

function addVendorMenuRow(item = { name: "", desc: "", price: "" }) {
  const container = document.getElementById("vendor-menu-items");
  const row = document.createElement("div");
  row.className = "vendor-menu-row";

  const fields = [
    { label: "Item name", name: "name", type: "text", value: item.name, required: true },
    { label: "Description", name: "desc", type: "text", value: item.desc },
    { label: "Price (₱)", name: "price", type: "number", value: item.price, required: true, min: "0", step: "0.01" },
  ];
  fields.forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;
    const input = document.createElement("input");
    input.type = field.type;
    input.name = field.name;
    input.value = String(field.value);
    input.required = Boolean(field.required);
    input.setAttribute("aria-label", field.label);
    if (field.min !== undefined) input.min = field.min;
    if (field.step !== undefined) input.step = field.step;
    label.appendChild(input);
    row.appendChild(label);
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "vendor-menu-remove";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    row.remove();
    const rows = [...container.querySelectorAll(".vendor-menu-row")];
    rows.forEach((menuRow) => {
      menuRow.querySelector(".vendor-menu-remove").disabled = rows.length === 1;
    });
  });
  row.appendChild(remove);
  container.appendChild(row);
  const rows = [...container.querySelectorAll(".vendor-menu-row")];
  rows.forEach((menuRow) => {
    menuRow.querySelector(".vendor-menu-remove").disabled = rows.length === 1;
  });
}

function renderVendorMenu(stall) {
  const statusText = document.getElementById("vendor-shop-status");
  const toggleButton = document.getElementById("vendor-shop-toggle");
  const open = isOpenNow(stall);
  statusText.textContent = open ? "Your shop is open and can accept orders." : "Your shop is closed and cannot accept orders.";
  statusText.classList.toggle("is-closed", !open);
  toggleButton.textContent = open ? "Close shop" : "Open shop";
  toggleButton.setAttribute("aria-label", open ? "Close shop" : "Open shop");

  const container = document.getElementById("vendor-menu-items");
  container.replaceChildren();
  stall.menu.forEach((item) => addVendorMenuRow(item));
  document.getElementById("vendor-menu-feedback").textContent = "";
}

function saveVendorMenu(stall) {
  const rows = [...document.querySelectorAll("#vendor-menu-items .vendor-menu-row")];
  const menu = rows.map((row) => ({
    name: row.querySelector('[name="name"]').value.trim(),
    desc: row.querySelector('[name="desc"]').value.trim(),
    price: Number(row.querySelector('[name="price"]').value),
  }));
  if (!menu.length || menu.some((item) => !item.name || !Number.isFinite(item.price) || item.price < 0)) {
    throw new Error("Add at least one menu item with a valid name and price.");
  }
  const nextMenus = { ...readVendorSettingsObject(VENDOR_MENUS_KEY), [stall.id]: menu };
  localStorage.setItem(VENDOR_MENUS_KEY, JSON.stringify(nextMenus));
  vendorMenus = nextMenus;
  stall.menu = menu.map((item) => ({ ...item }));
  document.getElementById("vendor-menu-feedback").textContent = "Menu and prices saved.";
  if (!$results.hidden) {
    if ($detailView.hidden) renderList();
    else showDetail(stall);
  }
}

function setVendorShopStatus(stall, isOpen) {
  const nextStatuses = { ...readVendorSettingsObject(VENDOR_SHOP_STATUS_KEY), [stall.id]: isOpen };
  localStorage.setItem(VENDOR_SHOP_STATUS_KEY, JSON.stringify(nextStatuses));
  vendorShopStatus = nextStatuses;
  stall.manualOpen = isOpen;
  renderVendorMenu(stall);
  if (!$results.hidden) {
    if ($detailView.hidden) renderList();
    else showDetail(stall);
  }
}

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
    if (!vendorSettingsLoaded) loadVendorSettings();
    document.getElementById("vendor-stall-name").textContent = stall.name;
    renderVendorMenu(stall);
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
  $profilePage.hidden = true;
  $adminPanel.hidden = true;
  $vendorPanel.hidden = false;
  updateCustomerChrome();
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

$resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById("reset-email").value.trim().toLowerCase();
    const password = document.getElementById("reset-password").value;
    const confirmation = document.getElementById("reset-password-confirm").value;
    if (password !== confirmation) return authError("The new passwords do not match.");
    const users = getUsers();
    const user = users[email];
    if (!user || !["customer", "vendor"].includes(user.role)) {
      return authError("No matching customer or vendor account was found in this browser.");
    }
    const salt = randomSalt();
    user.salt = salt;
    user.hash = await hashPassword(password, salt);
    saveUsers(users);
    $resetPasswordForm.reset();
    $authMsg.textContent = "Password updated for this browser's demo account. No reset email was sent.";
    $authMsg.className = "form-msg ok";
  } catch (err) {
    authError(`Could not reset password: ${err.message}`);
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
  renderAccount();
  showHome();
});

document.getElementById("admin-logout").addEventListener("click", () => {
  clearSession();
  $adminPanel.hidden = true;
  renderAccount();
  showAuth("login");
});

document.getElementById("vendor-back").addEventListener("click", () => {
  $vendorPanel.hidden = true;
  showHome();
});

document.getElementById("vendor-logout").addEventListener("click", () => {
  clearSession();
  $vendorPanel.hidden = true;
  renderAccount();
  showAuth("vendor");
});

document.getElementById("profile-logout").addEventListener("click", () => {
  clearSession();
  renderAccount();
  showHome();
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

document.getElementById("vendor-shop-toggle").addEventListener("click", () => {
  const user = currentUser();
  const stall = user && user.role === "vendor"
    ? STALLS.find((entry) => entry.id === Number(user.stallId))
    : null;
  if (!stall) return;
  try {
    setVendorShopStatus(stall, !isOpenNow(stall));
  } catch (err) {
    document.getElementById("vendor-shop-status").textContent = `Could not update shop status: ${err.message}`;
  }
});

document.getElementById("vendor-menu-add").addEventListener("click", () => addVendorMenuRow());

document.getElementById("vendor-menu-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const user = currentUser();
  const stall = user && user.role === "vendor"
    ? STALLS.find((entry) => entry.id === Number(user.stallId))
    : null;
  if (!stall) return;
  try {
    saveVendorMenu(stall);
  } catch (err) {
    document.getElementById("vendor-menu-feedback").textContent = `Could not save menu: ${err.message}`;
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
  try {
    loadVendorSettings();
  } catch (err) {
    authError(`Vendor settings could not be loaded: ${err.message}`);
  }
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
    updateCustomerChrome("home");
    $craveInput.focus();
  } else {
    $auth.hidden = false;
    updateCustomerChrome();
    setAuthMode("login");
    document.getElementById("login-email").focus();
  }
}

startApp();
