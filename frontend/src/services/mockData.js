// src/services/mockData.js

export const DEMO_STORES = [
  {
    _id: "store_1",
    shopName: "Fresh Mart",
    category: "Grocery",
    rating: 4.8,
    address: "Madhapur Main Road, Hyderabad",
    location: { type: "Point", coordinates: [78.3915, 17.4483] }, // Lng, Lat
    products: [
      { _id: "p1", name: "Organic Milk 1L", price: 65, category: "Dairy" },
      { _id: "p2", name: "Whole Wheat Bread", price: 40, category: "Bakery" },
      { _id: "p3", name: "Farm Eggs (6 pcs)", price: 45, category: "Dairy" },
    ]
  },
  {
    _id: "store_2",
    shopName: "Quick Pharmacy",
    category: "Pharmacy",
    rating: 4.6,
    address: "KPHB Colony, Hyderabad",
    location: { type: "Point", coordinates: [78.3996, 17.4933] },
    products: [
      { _id: "p4", name: "Paracetamol 650mg", price: 35, category: "Medicine" },
      { _id: "p5", name: "Vitamin C Tablets", price: 120, category: "Supplements" },
      { _id: "p6", name: "First Aid Kit", price: 250, category: "Health" },
    ]
  },
  {
    _id: "store_3",
    shopName: "City Bakery",
    category: "Bakery",
    rating: 4.9,
    address: "Jubilee Hills, Hyderabad",
    location: { type: "Point", coordinates: [78.4011, 17.4326] },
    products: [
      { _id: "p7", name: "Chocolate Truffle Cake", price: 550, category: "Dessert" },
      { _id: "p8", name: "Butter Croissant", price: 80, category: "Pastry" },
      { _id: "p9", name: "Sourdough Loaf", price: 150, category: "Bread" },
    ]
  }
];

export const DEMO_AGENT = {
  _id: "agent_1",
  user: {
    _id: "u_agent",
    name: "Demo Delivery Partner",
    phone: "9876543210",
    role: "agent"
  },
  vehicleType: "bike",
  isAvailable: false,
};
