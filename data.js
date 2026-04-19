const CATEGORIES = ["Tất cả", "Cà phê", "Trà", "Đá xay", "Bánh"];

const PRODUCTS = [
  {
    id: 1,
    name: "Cà phê sữa đá",
    category: "Cà phê",
    price: 29000,
    description: "Cà phê rang xay, sữa đặc và đá viên.",
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 2,
    name: "Bạc xỉu",
    category: "Cà phê",
    price: 32000,
    description: "Sữa tươi béo nhẹ, vị cà phê dịu.",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 3,
    name: "Americano đá",
    category: "Cà phê",
    price: 35000,
    description: "Espresso pha cùng nước lạnh, vị mạnh gọn.",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 4,
    name: "Trà đào cam sả",
    category: "Trà",
    price: 39000,
    description: "Trà đen, đào miếng, cam vàng và sả tươi.",
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 5,
    name: "Trà sữa oolong",
    category: "Trà",
    price: 42000,
    description: "Trà oolong thơm, sữa tươi và trân châu.",
    image:
      "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 6,
    name: "Matcha đá xay",
    category: "Đá xay",
    price: 49000,
    description: "Bột matcha, sữa tươi và lớp kem mịn.",
    image:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 7,
    name: "Cookie đá xay",
    category: "Đá xay",
    price: 52000,
    description: "Bánh cookie, sữa tươi, cacao và kem.",
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
  {
    id: 8,
    name: "Croissant bơ",
    category: "Bánh",
    price: 36000,
    description: "Bánh croissant lớp mỏng, thơm bơ.",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    status: "Còn bán",
  },
];

const SAMPLE_ORDERS = [
  {
    code: "N31001",
    customerName: "Nguyễn Minh Anh",
    phone: "0901234567",
    address: "12 Nguyễn Trãi, Quận 1",
    paymentMethod: "COD",
    status: "Đang giao",
    createdAt: "2026-04-19 08:30",
    items: [
      { productId: 1, name: "Cà phê sữa đá", quantity: 2, price: 29000 },
      { productId: 8, name: "Croissant bơ", quantity: 1, price: 36000 },
    ],
    subtotal: 94000,
    shippingFee: 15000,
    total: 109000,
  },
  {
    code: "N31002",
    customerName: "Trần Quốc Bảo",
    phone: "0912345678",
    address: "45 Lê Lợi, Quận 3",
    paymentMethod: "Chuyển khoản",
    status: "Hoàn thành",
    createdAt: "2026-04-19 09:10",
    items: [{ productId: 4, name: "Trà đào cam sả", quantity: 1, price: 39000 }],
    subtotal: 39000,
    shippingFee: 15000,
    total: 54000,
  },
];

function getProducts() {
  const stored = localStorage.getItem("nhom3_products");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("nhom3_products", JSON.stringify(PRODUCTS));
  return PRODUCTS;
}

function getOrders() {
  const stored = localStorage.getItem("nhom3_orders");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("nhom3_orders", JSON.stringify(SAMPLE_ORDERS));
  return SAMPLE_ORDERS;
}

function saveOrders(orders) {
  localStorage.setItem("nhom3_orders", JSON.stringify(orders));
}

function resetDemoData() {
  localStorage.setItem("nhom3_products", JSON.stringify(PRODUCTS));
  localStorage.setItem("nhom3_orders", JSON.stringify(SAMPLE_ORDERS));
}
