let adminProducts = getProducts();
let adminOrders = getOrders();

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + " đ";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderStats() {
  const completed = adminOrders.filter((order) => order.status === "Hoàn thành");
  const revenue = completed.reduce((sum, order) => sum + order.total, 0);
  const processing = adminOrders.filter((order) =>
    ["Chờ xác nhận", "Đang chuẩn bị", "Đang giao"].includes(order.status)
  ).length;

  document.getElementById("dashboardStats").innerHTML = `
    <article class="stat-card">
      <span>Đơn hàng</span>
      <strong>${adminOrders.length}</strong>
    </article>
    <article class="stat-card">
      <span>Đang xử lý</span>
      <strong>${processing}</strong>
    </article>
    <article class="stat-card">
      <span>Doanh thu hoàn thành</span>
      <strong>${formatMoney(revenue)}</strong>
    </article>
  `;
}

function renderOrders() {
  const filter = document.getElementById("statusFilter").value;
  const visibleOrders = filter === "all" ? adminOrders : adminOrders.filter((order) => order.status === filter);

  document.getElementById("ordersTable").innerHTML = visibleOrders
    .map(
      (order) => `
        <tr>
          <td><strong>${order.code}</strong></td>
          <td>${order.customerName}</td>
          <td>${order.phone}</td>
          <td>${formatMoney(order.total)}</td>
          <td><span class="status-badge">${order.status}</span></td>
          <td>
            <select data-order-status="${order.code}">
              <option ${order.status === "Chờ xác nhận" ? "selected" : ""}>Chờ xác nhận</option>
              <option ${order.status === "Đang chuẩn bị" ? "selected" : ""}>Đang chuẩn bị</option>
              <option ${order.status === "Đang giao" ? "selected" : ""}>Đang giao</option>
              <option ${order.status === "Hoàn thành" ? "selected" : ""}>Hoàn thành</option>
              <option ${order.status === "Đã hủy" ? "selected" : ""}>Đã hủy</option>
            </select>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderProductsTable() {
  document.getElementById("productsTable").innerHTML = adminProducts
    .map(
      (product) => `
        <tr>
          <td><strong>${product.name}</strong></td>
          <td>${product.category}</td>
          <td>${formatMoney(product.price)}</td>
          <td><span class="status-badge">${product.status}</span></td>
        </tr>
      `
    )
    .join("");
}

document.getElementById("statusFilter").addEventListener("change", renderOrders);

document.getElementById("ordersTable").addEventListener("change", (event) => {
  const select = event.target.closest("select[data-order-status]");
  if (!select) return;
  const order = adminOrders.find((item) => item.code === select.dataset.orderStatus);
  order.status = select.value;
  saveOrders(adminOrders);
  renderStats();
  renderOrders();
  showToast("Đã cập nhật trạng thái đơn hàng");
});

document.getElementById("resetData").addEventListener("click", () => {
  resetDemoData();
  adminProducts = getProducts();
  adminOrders = getOrders();
  renderStats();
  renderOrders();
  renderProductsTable();
  showToast("Đã khôi phục dữ liệu mẫu");
});

renderStats();
renderOrders();
renderProductsTable();
