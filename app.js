const SHIPPING_FEE = 15000;
let products = getProducts();
let orders = getOrders();
let cart = JSON.parse(localStorage.getItem("nhom3_cart") || "[]");
let activeCategory = "Tất cả";

const productGrid = document.getElementById("productGrid");
const categoryTabs = document.getElementById("categoryTabs");
const searchInput = document.getElementById("searchInput");
const cartPanel = document.getElementById("cartPanel");
const backdrop = document.getElementById("backdrop");
const cartItems = document.getElementById("cartItems");
const checkoutItems = document.getElementById("checkoutItems");
const checkoutForm = document.getElementById("checkoutForm");
const trackingForm = document.getElementById("trackingForm");

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + " đ";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function saveCart() {
  localStorage.setItem("nhom3_cart", JSON.stringify(cart));
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCategories() {
  categoryTabs.innerHTML = CATEGORIES.map(
    (category) =>
      `<button class="${category === activeCategory ? "active" : ""}" data-category="${category}" type="button">${category}</button>`
  ).join("");
}

function renderProducts() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchCategory = activeCategory === "Tất cả" || product.category === activeCategory;
    const matchKeyword = product.name.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword && product.status === "Còn bán";
  });

  productGrid.innerHTML = filtered
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.image}" alt="${product.name}" />
          <div class="product-content">
            <div>
              <span class="pill">${product.category}</span>
              <h3>${product.name}</h3>
              <p>${product.description}</p>
            </div>
            <div class="product-bottom">
              <strong>${formatMoney(product.price)}</strong>
              <button class="secondary-button" type="button" data-add="${product.id}">Thêm</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCart() {
  const subtotal = getCartSubtotal();
  document.getElementById("cartCount").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartSubtotal").textContent = formatMoney(subtotal);
  document.getElementById("subtotalText").textContent = formatMoney(subtotal);
  document.getElementById("shippingText").textContent = subtotal > 0 ? formatMoney(SHIPPING_FEE) : formatMoney(0);
  document.getElementById("totalText").textContent = formatMoney(subtotal > 0 ? subtotal + SHIPPING_FEE : 0);

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-text">Giỏ hàng đang trống.</p>';
    checkoutItems.innerHTML = '<p class="empty-text">Chưa có món nào được chọn.</p>';
    return;
  }

  const itemHtml = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong>
            <span>${formatMoney(item.price)}</span>
          </div>
          <div class="quantity-control">
            <button type="button" data-decrease="${item.productId}">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-increase="${item.productId}">+</button>
          </div>
        </div>
      `
    )
    .join("");

  cartItems.innerHTML = itemHtml;
  checkoutItems.innerHTML = cart
    .map(
      (item) => `
        <div class="summary-item">
          <span>${item.name} x ${item.quantity}</span>
          <strong>${formatMoney(item.price * item.quantity)}</strong>
        </div>
      `
    )
    .join("");
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();
  showToast("Đã thêm món vào giỏ hàng");
}

function updateQuantity(productId, amount) {
  const item = cart.find((cartItem) => cartItem.productId === productId);
  if (!item) return;
  item.quantity += amount;
  cart = cart.filter((cartItem) => cartItem.quantity > 0);
  saveCart();
  renderCart();
}

function openCart() {
  cartPanel.classList.add("open");
  backdrop.classList.add("show");
  cartPanel.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartPanel.classList.remove("open");
  backdrop.classList.remove("show");
  cartPanel.setAttribute("aria-hidden", "true");
}

function createOrder(formData) {
  const subtotal = getCartSubtotal();
  const newOrder = {
    code: "N3" + Math.floor(1000 + Math.random() * 9000),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    paymentMethod: formData.get("paymentMethod"),
    note: formData.get("note"),
    status: "Chờ xác nhận",
    createdAt: new Date().toLocaleString("vi-VN"),
    items: cart,
    subtotal,
    shippingFee: SHIPPING_FEE,
    total: subtotal + SHIPPING_FEE,
  };

  orders = [newOrder, ...orders];
  saveOrders(orders);
  cart = [];
  saveCart();
  renderCart();
  checkoutForm.reset();
  showToast(`Đặt hàng thành công. Mã đơn: ${newOrder.code}`);
}

function renderTracking(order) {
  const result = document.getElementById("trackingResult");
  if (!order) {
    result.innerHTML = '<p class="empty-text">Không tìm thấy đơn hàng.</p>';
    return;
  }

  result.innerHTML = `
    <div class="tracking-card">
      <div>
        <span class="pill">${order.status}</span>
        <h3>${order.code}</h3>
        <p>${order.customerName} - ${order.phone}</p>
      </div>
      <strong>${formatMoney(order.total)}</strong>
    </div>
  `;
}

categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderCategories();
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-add]");
  if (!button) return;
  addToCart(Number(button.dataset.add));
});

cartItems.addEventListener("click", (event) => {
  const increase = event.target.closest("button[data-increase]");
  const decrease = event.target.closest("button[data-decrease]");
  if (increase) updateQuantity(Number(increase.dataset.increase), 1);
  if (decrease) updateQuantity(Number(decrease.dataset.decrease), -1);
});

searchInput.addEventListener("input", renderProducts);
document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("backdrop").addEventListener("click", closeCart);
document.getElementById("checkoutLink").addEventListener("click", closeCart);

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (cart.length === 0) {
    showToast("Vui lòng chọn món trước khi đặt hàng");
    return;
  }
  createOrder(new FormData(checkoutForm));
});

trackingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = new FormData(trackingForm).get("orderCode").trim().toUpperCase();
  const order = getOrders().find((item) => item.code.toUpperCase() === code);
  renderTracking(order);
});

renderCategories();
renderProducts();
renderCart();
