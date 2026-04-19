const CATEGORIES = [
  { id: 0, name: "Tất cả" },
  { id: 1, name: "Đồ uống" },
  { id: 2, name: "Bánh kẹo" },
  { id: 3, name: "Gia vị" },
  { id: 4, name: "Mì - Cháo ăn liền" },
];

const PRODUCTS = [
  {
    id: 1,
    categoryId: 1,
    name: "Nước suối Lavie 500ml",
    price: 5000,
    stock: 95,
    warningStock: 10,
    unit: "chai",
    image:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    categoryId: 1,
    name: "Coca Cola 330ml lon",
    price: 12000,
    stock: 47,
    warningStock: 8,
    unit: "lon",
    image:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    categoryId: 2,
    name: "Bánh quy Marie",
    price: 18000,
    stock: 28,
    warningStock: 5,
    unit: "gói",
    image:
      "https://images.unsplash.com/photo-1590080875852-ba44f83ff2db?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    categoryId: 2,
    name: "Kẹo dừa Bến Tre",
    price: 25000,
    stock: 19,
    warningStock: 5,
    unit: "hộp",
    image:
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    categoryId: 3,
    name: "Nước mắm Phú Quốc 500ml",
    price: 35000,
    stock: 14,
    warningStock: 3,
    unit: "chai",
    image:
      "https://images.unsplash.com/photo-1606914469633-bd39206ea739?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    categoryId: 4,
    name: "Mì Hảo Hảo tôm chua cay",
    price: 4000,
    stock: 190,
    warningStock: 20,
    unit: "gói",
    image:
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=80",
  },
];

const SAMPLE_CUSTOMERS = [
  { id: 1, name: "Nguyễn Văn An", phone: "0901234567" },
  { id: 2, name: "Trần Thị Bích", phone: "0912345678" },
  { id: 3, name: "Lê Hoàng Minh", phone: "0923456789" },
];

const SAMPLE_ORDERS = [
  {
    id: 1,
    code: "DH1001",
    customerName: "Nguyễn Văn An",
    phone: "0901234567",
    createdAt: "2025-04-20 09:30",
    receiveType: "giao_hang",
    receiveTime: "2025-04-20 09:30",
    address: "12 Trần Hưng Đạo, Hoàn Kiếm, HN",
    status: "dang_giao",
    items: [
      { productId: 1, name: "Nước suối Lavie 500ml", quantity: 5, price: 5000 },
      { productId: 6, name: "Mì Hảo Hảo tôm chua cay", quantity: 10, price: 4000 },
    ],
    total: 65000,
  },
  {
    id: 2,
    code: "DH1002",
    customerName: "Trần Thị Bích",
    phone: "0912345678",
    createdAt: "2025-04-20 14:00",
    receiveType: "tu_den",
    receiveTime: "2025-04-20 14:00",
    address: "",
    status: "cho",
    items: [
      { productId: 3, name: "Bánh quy Marie", quantity: 2, price: 18000 },
      { productId: 4, name: "Kẹo dừa Bến Tre", quantity: 1, price: 25000 },
    ],
    total: 61000,
  },
  {
    id: 3,
    code: "DH1003",
    customerName: "Lê Hoàng Minh",
    phone: "0923456789",
    createdAt: "2025-04-21 08:00",
    receiveType: "giao_hang",
    receiveTime: "2025-04-21 08:00",
    address: "45 Lý Thường Kiệt, Hai Bà Trưng, HN",
    status: "xong",
    items: [
      { productId: 2, name: "Coca Cola 330ml lon", quantity: 3, price: 12000 },
      { productId: 5, name: "Nước mắm Phú Quốc 500ml", quantity: 1, price: 35000 },
    ],
    total: 71000,
  },
];

function getProducts() {
  const stored = localStorage.getItem("taphoa_products");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("taphoa_products", JSON.stringify(PRODUCTS));
  return PRODUCTS;
}

function saveProducts(products) {
  localStorage.setItem("taphoa_products", JSON.stringify(products));
}

function getOrders() {
  const stored = localStorage.getItem("taphoa_orders");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("taphoa_orders", JSON.stringify(SAMPLE_ORDERS));
  return SAMPLE_ORDERS;
}

function saveOrders(orders) {
  localStorage.setItem("taphoa_orders", JSON.stringify(orders));
}

function resetDemoData() {
  localStorage.setItem("taphoa_products", JSON.stringify(PRODUCTS));
  localStorage.setItem("taphoa_orders", JSON.stringify(SAMPLE_ORDERS));
  localStorage.removeItem("taphoa_cart");
}

function getCategoryName(categoryId) {
  const category = CATEGORIES.find((item) => item.id === categoryId);
  return category ? category.name : "Chưa phân loại";
}

function getStatusLabel(status) {
  const labels = {
    cho: "Chờ xử lý",
    dang_giao: "Đang giao",
    xong: "Hoàn thành",
    huy: "Đã hủy",
  };
  return labels[status] || status;
}

function getReceiveTypeLabel(receiveType) {
  return receiveType === "tu_den" ? "Khách tự đến lấy" : "Giao hàng tận nơi";
}
