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
  const completed = adminOrders.filter((order) => order.status === "xong");
  const revenue = completed.reduce((sum, order) => sum + order.total, 0);
  const processing = adminOrders.filter((order) => ["cho", "dang_giao"].includes(order.status)).length;
  const lowStock = adminProducts.filter((product) => product.stock <= product.warningStock).length;

  document.getElementById("dashboardStats").innerHTML = `
    <article class="stat-card">
      <span>Tổng đơn hàng</span>
      <strong>${adminOrders.length}</strong>
    </article>
    <article class="stat-card">
      <span>Đơn đang xử lý</span>
      <strong>${processing}</strong>
    </article>
    <article class="stat-card">
      <span>Doanh thu hoàn thành</span>
      <strong>${formatMoney(revenue)}</strong>
    </article>
    <article class="stat-card">
      <span>Hàng sắp hết</span>
      <strong>${lowStock}</strong>
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
          <td>${order.customerName}<br /><span class="muted-cell">${order.phone}</span></td>
          <td>${getReceiveTypeLabel(order.receiveType)}</td>
          <td>${order.receiveTime || "Chưa hẹn"}</td>
          <td>${formatMoney(order.total)}</td>
          <td><span class="status-badge">${getStatusLabel(order.status)}</span></td>
          <td>
            <select data-order-status="${order.code}" ${order.status === "huy" || order.status === "xong" ? "disabled" : ""}>
              <option value="cho" ${order.status === "cho" ? "selected" : ""}>Chờ xử lý</option>
              <option value="dang_giao" ${order.status === "dang_giao" ? "selected" : ""}>Đang giao</option>
              <option value="xong" ${order.status === "xong" ? "selected" : ""}>Hoàn thành</option>
              <option value="huy" ${order.status === "huy" ? "selected" : ""}>Đã hủy</option>
            </select>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderProductsTable() {
  document.getElementById("productsTable").innerHTML = adminProducts
    .map((product) => {
      const rowClass = product.stock <= product.warningStock ? "low-stock-row" : "";
      return `
        <tr class="${rowClass}">
          <td><strong>${product.name}</strong></td>
          <td>${getCategoryName(product.categoryId)}</td>
          <td>${formatMoney(product.price)}</td>
          <td>${product.stock}</td>
          <td>${product.warningStock}</td>
          <td>${product.unit}</td>
        </tr>
      `;
    })
    .join("");
}

function renderLowStock() {
  const lowStock = adminProducts.filter((product) => product.stock <= product.warningStock);
  const container = document.getElementById("lowStockList");

  if (lowStock.length === 0) {
    container.innerHTML = '<p class="empty-text">Không có mặt hàng nào dưới ngưỡng cảnh báo.</p>';
    return;
  }

  container.innerHTML = lowStock
    .map(
      (product) => `
        <article class="warning-item">
          <div>
            <strong>${product.name}</strong>
            <span>${getCategoryName(product.categoryId)}</span>
          </div>
          <p>Còn ${product.stock} ${product.unit}, ngưỡng cảnh báo ${product.warningStock} ${product.unit}</p>
        </article>
      `
    )
    .join("");
}

function canMoveStatus(currentStatus, nextStatus, receiveType) {
  if (nextStatus === "huy") return currentStatus === "cho";
  if (currentStatus === "cho" && nextStatus === "xong") return true;
  if (currentStatus === "cho" && nextStatus === "dang_giao") return receiveType === "giao_hang";
  if (currentStatus === "dang_giao" && nextStatus === "xong") return true;
  return currentStatus === nextStatus;
}

function restoreStock(order) {
  adminProducts = adminProducts.map((product) => {
    const item = order.items.find((orderItem) => orderItem.productId === product.id);
    return item ? { ...product, stock: product.stock + item.quantity } : product;
  });
  saveProducts(adminProducts);
}

document.getElementById("statusFilter").addEventListener("change", renderOrders);

document.getElementById("ordersTable").addEventListener("change", (event) => {
  const select = event.target.closest("select[data-order-status]");
  if (!select) return;

  const order = adminOrders.find((item) => item.code === select.dataset.orderStatus);
  const nextStatus = select.value;

  if (!canMoveStatus(order.status, nextStatus, order.receiveType)) {
    showToast("Chuyển trạng thái không hợp lệ theo luồng của database");
    renderOrders();
    return;
  }

  if (nextStatus === "huy") {
    restoreStock(order);
  }

  order.status = nextStatus;
  saveOrders(adminOrders);
  renderStats();
  renderOrders();
  renderProductsTable();
  renderLowStock();
  showToast("Đã cập nhật trạng thái đơn hàng");
});

document.getElementById("resetData").addEventListener("click", () => {
  resetDemoData();
  adminProducts = getProducts();
  adminOrders = getOrders();
  renderStats();
  renderOrders();
  renderProductsTable();
  renderLowStock();
  showToast("Đã khôi phục dữ liệu mẫu");
});

renderStats();
renderOrders();
renderProductsTable();
renderLowStock();
