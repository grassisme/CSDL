let products = getProducts();
let orders = getOrders();
let cart = JSON.parse(localStorage.getItem("taphoa_cart") || "[]");
let activeCategoryId = 0;

const productGrid = document.getElementById("productGrid");
const categoryTabs = document.getElementById("categoryTabs");
const searchInput = document.getElementById("searchInput");
const cartPanel = document.getElementById("cartPanel");
const backdrop = document.getElementById("backdrop");
const cartItems = document.getElementById("cartItems");
const checkoutItems = document.getElementById("checkoutItems");
const checkoutForm = document.getElementById("checkoutForm");
const trackingForm = document.getElementById("trackingForm");
const receiveType = document.getElementById("receiveType");
const addressField = document.getElementById("addressField");

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
  localStorage.setItem("taphoa_cart", JSON.stringify(cart));
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartQuantity(productId) {
  const item = cart.find((cartItem) => cartItem.productId === productId);
  return item ? item.quantity : 0;
}

function renderCategories() {
  categoryTabs.innerHTML = CATEGORIES.map(
    (category) =>
      `<button class="${category.id === activeCategoryId ? "active" : ""}" data-category="${category.id}" type="button">${category.name}</button>`
  ).join("");
}

function renderProducts() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchCategory = activeCategoryId === 0 || product.categoryId === activeCategoryId;
    const matchKeyword = product.name.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword;
  });

  productGrid.innerHTML = filtered
    .map((product) => {
      const stockClass = product.stock <= product.warningStock ? "stock-warning" : "";
      const disabled = product.stock <= 0 ? "disabled" : "";
      const buttonText = product.stock <= 0 ? "Hết hàng" : "Thêm";

      return `
        <article class="product-card">
          <img src="${product.image}" alt="${product.name}" />
          <div class="product-content">
            <div>
              <span class="pill">${getCategoryName(product.categoryId)}</span>
              <h3>${product.name}</h3>
              <p>Còn ${product.stock} ${product.unit}. Ngưỡng cảnh báo: ${product.warningStock} ${product.unit}.</p>
            </div>
            <div class="product-bottom">
              <div>
                <strong>${formatMoney(product.price)}</strong>
                <span class="stock-text ${stockClass}">Tồn kho: ${product.stock}</span>
              </div>
              <button class="secondary-button" type="button" data-add="${product.id}" ${disabled}>${buttonText}</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCart() {
  const subtotal = getCartSubtotal();
  document.getElementById("cartCount").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartSubtotal").textContent = formatMoney(subtotal);
  document.getElementById("subtotalText").textContent = formatMoney(subtotal);
  document.getElementById("totalText").textContent = formatMoney(subtotal);

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-text">Giỏ hàng đang trống.</p>';
    checkoutItems.innerHTML = '<p class="empty-text">Chưa có mặt hàng nào được chọn.</p>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong>
            <span>${formatMoney(item.price)} / ${item.unit}</span>
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
  const currentQuantity = getCartQuantity(productId);

  if (currentQuantity >= product.stock) {
    showToast("Số lượng trong giỏ đã bằng tồn kho hiện có");
    return;
  }

  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();
  showToast("Đã thêm mặt hàng vào giỏ hàng");
}

function updateQuantity(productId, amount) {
  const item = cart.find((cartItem) => cartItem.productId === productId);
  const product = products.find((productItem) => productItem.id === productId);
  if (!item || !product) return;

  if (amount > 0 && item.quantity >= product.stock) {
    showToast("Không thể chọn vượt quá tồn kho");
    return;
  }

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

function syncReceiveType() {
  const isDelivery = receiveType.value === "giao_hang";
  addressField.style.display = isDelivery ? "grid" : "none";
  addressField.querySelector("textarea").required = isDelivery;
}

function createOrder(formData) {
  const subtotal = getCartSubtotal();
  const type = formData.get("receiveType");
  const address = formData.get("address").trim();

  if (type === "giao_hang" && !address) {
    showToast("Đơn giao hàng phải có địa chỉ giao");
    return;
  }

  const invalidItem = cart.find((item) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    return !product || product.stock < item.quantity;
  });

  if (invalidItem) {
    showToast(`Không đủ tồn kho cho mặt hàng ${invalidItem.name}`);
    return;
  }

  products = products.map((product) => {
    const item = cart.find((cartItem) => cartItem.productId === product.id);
    return item ? { ...product, stock: product.stock - item.quantity } : product;
  });

  const nextId = orders.length ? Math.max(...orders.map((order) => order.id)) + 1 : 1;
  const newOrder = {
    id: nextId,
    code: "DH" + String(1000 + nextId),
    customerName: formData.get("customerName").trim(),
    phone: formData.get("phone").trim(),
    createdAt: new Date().toLocaleString("vi-VN"),
    receiveType: type,
    receiveTime: formData.get("receiveTime") || "",
    address,
    status: "cho",
    items: cart,
    total: subtotal,
  };

  orders = [newOrder, ...orders];
  saveProducts(products);
  saveOrders(orders);
  cart = [];
  saveCart();
  renderProducts();
  renderCart();
  checkoutForm.reset();
  syncReceiveType();
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
        <span class="pill">${getStatusLabel(order.status)}</span>
        <h3>${order.code}</h3>
        <p>${order.customerName} - ${order.phone}</p>
        <p>${getReceiveTypeLabel(order.receiveType)}${order.receiveTime ? " - " + order.receiveTime : ""}</p>
      </div>
      <strong>${formatMoney(order.total)}</strong>
    </div>
  `;
}

categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategoryId = Number(button.dataset.category);
  renderCategories();
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-add]");
  if (!button || button.disabled) return;
  addToCart(Number(button.dataset.add));
});

cartItems.addEventListener("click", (event) => {
  const increase = event.target.closest("button[data-increase]");
  const decrease = event.target.closest("button[data-decrease]");
  if (increase) updateQuantity(Number(increase.dataset.increase), 1);
  if (decrease) updateQuantity(Number(decrease.dataset.decrease), -1);
});

searchInput.addEventListener("input", renderProducts);
receiveType.addEventListener("change", syncReceiveType);
document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("backdrop").addEventListener("click", closeCart);
document.getElementById("checkoutLink").addEventListener("click", closeCart);

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (cart.length === 0) {
    showToast("Vui lòng chọn mặt hàng trước khi đặt hàng");
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

syncReceiveType();
renderCategories();
renderProducts();
renderCart();
