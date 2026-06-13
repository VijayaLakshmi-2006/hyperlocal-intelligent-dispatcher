import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/userModel.js';
import Shop from './models/shopModel.js';

dotenv.config();

const groceryProducts = [
  { name: 'Amul Full Cream Milk 1L', price: 68, category: 'Dairy', stock: 100, description: 'Fresh full cream milk', keywords: ['milk', 'dairy', 'amul'] },
  { name: 'Britannia Bread White 400g', price: 42, category: 'Bakery', stock: 80, description: 'Soft white bread loaf', keywords: ['bread', 'bakery', 'britannia'] },
  { name: 'Farm Fresh Eggs (12 pcs)', price: 95, category: 'Eggs', stock: 60, description: 'Fresh farm eggs pack of 12', keywords: ['eggs', 'protein'] },
  { name: 'India Gate Basmati Rice 1kg', price: 145, category: 'Grains', stock: 50, description: 'Premium aged basmati rice', keywords: ['rice', 'basmati', 'grains'] },
  { name: 'Fortune Sunflower Oil 1L', price: 155, category: 'Oil', stock: 40, description: 'Refined sunflower oil', keywords: ['oil', 'sunflower', 'cooking'] },
  { name: 'Tomatoes 500g', price: 30, category: 'Vegetables', stock: 120, description: 'Fresh red tomatoes', keywords: ['tomato', 'vegetables', 'fresh'] },
  { name: 'Onions 1kg', price: 40, category: 'Vegetables', stock: 100, description: 'Fresh red onions', keywords: ['onion', 'vegetables'] },
  { name: 'Bananas (Dozen)', price: 55, category: 'Fruits', stock: 60, description: 'Fresh yellow bananas', keywords: ['banana', 'fruits'] },
  { name: 'Apples Royal Gala 500g', price: 120, category: 'Fruits', stock: 40, description: 'Crispy royal gala apples', keywords: ['apple', 'fruits'] },
  { name: 'Lays Classic Salted 100g', price: 30, category: 'Snacks', stock: 80, description: 'Classic potato chips', keywords: ['chips', 'snacks', 'lays'] },
  { name: 'Maggi 2-Minute Noodles (12pk)', price: 192, category: 'Instant Food', stock: 60, description: 'Classic masala noodles pack', keywords: ['maggi', 'noodles', 'instant'] },
  { name: 'Coca-Cola 1.25L', price: 70, category: 'Beverages', stock: 45, description: 'Chilled coca-cola bottle', keywords: ['coke', 'cola', 'soft drink'] },
  { name: 'Amul Butter 500g', price: 285, category: 'Dairy', stock: 30, description: 'Pure white butter', keywords: ['butter', 'dairy', 'amul'] },
  { name: 'Toor Dal 1kg', price: 130, category: 'Pulses', stock: 70, description: 'Premium toor dal', keywords: ['dal', 'pulses', 'lentils'] },
  { name: 'Parle-G Biscuits 400g', price: 60, category: 'Snacks', stock: 90, description: 'Classic glucose biscuits', keywords: ['biscuit', 'parle', 'snacks'] },
];

const pharmacyProducts = [
  { name: 'Paracetamol 650mg (10 tabs)', price: 18, category: 'Medicine', stock: 200, description: 'Fever & pain relief tablets', keywords: ['paracetamol', 'fever', 'pain', 'medicine'] },
  { name: 'Crocin Cold & Flu 10 tabs', price: 65, category: 'Medicine', stock: 150, description: 'Cold and flu relief', keywords: ['cold', 'flu', 'crocin'] },
  { name: 'Benadryl Cough Syrup 100ml', price: 95, category: 'Medicine', stock: 80, description: 'Dry cough syrup', keywords: ['cough', 'syrup', 'benadryl'] },
  { name: 'Dettol Antiseptic 500ml', price: 165, category: 'First Aid', stock: 60, description: 'Antiseptic liquid for wounds', keywords: ['dettol', 'antiseptic', 'first aid'] },
  { name: 'Band-Aid Assorted 30 pcs', price: 85, category: 'First Aid', stock: 100, description: 'Assorted bandage strips', keywords: ['bandage', 'bandaid', 'first aid'] },
  { name: 'Livogen Zinc Iron Tablets (15)', price: 78, category: 'Vitamins', stock: 90, description: 'Iron & zinc supplement', keywords: ['iron', 'zinc', 'vitamins', 'supplement'] },
  { name: 'Revital H Multivitamin (30)', price: 230, category: 'Vitamins', stock: 50, description: 'Complete daily multivitamin', keywords: ['multivitamin', 'revital', 'supplement'] },
  { name: 'Dabur Sanitizer 500ml', price: 120, category: 'Hygiene', stock: 80, description: 'Instant hand sanitizer', keywords: ['sanitizer', 'hygiene', 'dabur'] },
  { name: 'N95 Face Masks (Pack 5)', price: 199, category: 'Hygiene', stock: 100, description: '5-layer N95 protection masks', keywords: ['mask', 'n95', 'protection', 'hygiene'] },
  { name: 'ORS Electrolyte Sachet (5)', price: 45, category: 'Medicine', stock: 120, description: 'Oral rehydration salts', keywords: ['ors', 'electrolyte', 'dehydration'] },
  { name: 'Digital Thermometer', price: 285, category: 'Devices', stock: 40, description: 'Fast-read digital thermometer', keywords: ['thermometer', 'digital', 'temperature'] },
  { name: 'Volini Spray 100g', price: 195, category: 'Pain Relief', stock: 60, description: 'Topical pain relief spray', keywords: ['volini', 'pain', 'muscle', 'spray'] },
];

const electronicsProducts = [
  { name: 'Anker 20W Fast Charger', price: 1299, category: 'Chargers', stock: 40, description: 'USB-C fast wall charger', keywords: ['charger', 'fast charge', 'anker', 'usb-c'] },
  { name: 'Baseus 10000mAh Power Bank', price: 1499, category: 'Power Banks', stock: 30, description: 'Slim 10000mAh power bank', keywords: ['power bank', 'battery', 'baseus'] },
  { name: 'boAt Airdopes 121v2 Earbuds', price: 899, category: 'Audio', stock: 25, description: 'True wireless earbuds with 14hr battery', keywords: ['earbuds', 'tws', 'boat', 'wireless'] },
  { name: 'USB-C to USB-A Cable 2m', price: 299, category: 'Cables', stock: 80, description: 'Braided fast charging cable', keywords: ['usb-c', 'cable', 'charging'] },
  { name: 'Zebronics Mechanical Keyboard', price: 1899, category: 'Peripherals', stock: 15, description: 'RGB backlit mechanical keyboard', keywords: ['keyboard', 'mechanical', 'rgb', 'zebronics'] },
  { name: 'Logitech B100 USB Mouse', price: 499, category: 'Peripherals', stock: 35, description: 'Optical USB mouse', keywords: ['mouse', 'logitech', 'usb'] },
  { name: 'JBL Go 3 Bluetooth Speaker', price: 2999, category: 'Audio', stock: 20, description: 'Portable waterproof speaker', keywords: ['speaker', 'bluetooth', 'jbl', 'portable'] },
  { name: 'Screen Protector Universal', price: 199, category: 'Accessories', stock: 100, description: 'Tempered glass screen protector', keywords: ['screen protector', 'tempered glass'] },
  { name: 'OTG Adapter Type-C', price: 249, category: 'Cables', stock: 60, description: 'USB OTG adapter for phones', keywords: ['otg', 'adapter', 'usb-c'] },
  { name: 'Phone Stand Adjustable', price: 349, category: 'Accessories', stock: 50, description: 'Foldable phone/tablet stand', keywords: ['stand', 'holder', 'phone'] },
  { name: 'HDMI to USB-C Cable 1.5m', price: 599, category: 'Cables', stock: 30, description: 'Connect phone to TV/monitor', keywords: ['hdmi', 'usb-c', 'cable', 'display'] },
];

const foodProducts = [
  { name: 'Butter Chicken (Full)', price: 299, category: 'Main Course', stock: 30, description: 'Rich creamy butter chicken curry', keywords: ['butter chicken', 'curry', 'chicken'] },
  { name: 'Paneer Tikka Masala', price: 269, category: 'Main Course', stock: 25, description: 'Smoky paneer in spiced gravy', keywords: ['paneer', 'tikka', 'vegetarian'] },
  { name: 'Biryani Chicken (1 portion)', price: 249, category: 'Rice', stock: 40, description: 'Fragrant chicken biryani with raita', keywords: ['biryani', 'chicken', 'rice'] },
  { name: 'Garlic Naan (4 pcs)', price: 89, category: 'Breads', stock: 50, description: 'Soft garlic naan from tandoor', keywords: ['naan', 'bread', 'tandoor'] },
  { name: 'Masala Dosa', price: 119, category: 'South Indian', stock: 35, description: 'Crispy dosa with spiced potato filling', keywords: ['dosa', 'south indian', 'breakfast'] },
  { name: 'Veg Burger Combo', price: 179, category: 'Fast Food', stock: 45, description: 'Crispy veg burger with fries & drink', keywords: ['burger', 'fast food', 'veg'] },
  { name: 'Margherita Pizza 8"', price: 249, category: 'Fast Food', stock: 25, description: 'Classic tomato sauce and mozzarella', keywords: ['pizza', 'margherita', 'italian'] },
  { name: 'Chocolate Brownie Slice', price: 89, category: 'Desserts', stock: 40, description: 'Warm fudgy chocolate brownie', keywords: ['brownie', 'dessert', 'chocolate'] },
  { name: 'Fresh Lime Soda', price: 59, category: 'Beverages', stock: 60, description: 'Chilled lime soda sweet/salty', keywords: ['lime', 'soda', 'drink'] },
  { name: 'Dal Makhani + Rice Combo', price: 199, category: 'Combo Meals', stock: 30, description: 'Creamy dal makhani with steamed rice', keywords: ['dal', 'rice', 'combo', 'vegetarian'] },
  { name: 'Chicken Shawarma Wrap', price: 169, category: 'Fast Food', stock: 35, description: 'Juicy chicken shawarma in pita bread', keywords: ['shawarma', 'wrap', 'chicken'] },
  { name: 'Gulab Jamun (4 pcs)', price: 79, category: 'Desserts', stock: 50, description: 'Soft milk dumplings in sugar syrup', keywords: ['gulab jamun', 'sweet', 'dessert'] },
];

const demoShops = [
  {
    shopName: 'FreshMart Superstore',
    ownerName: 'System',
    category: 'Grocery',
    phone: '9000000001',
    address: 'Madhapur, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.3915, 17.4483] },
    rating: 4.7,
    deliveryFee: 0,
    isOpen: true,
    products: groceryProducts,
  },
  {
    shopName: 'Green Basket Organic',
    ownerName: 'System',
    category: 'Grocery',
    phone: '9000000002',
    address: 'Gachibowli, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.3641, 17.4418] },
    rating: 4.5,
    deliveryFee: 0,
    isOpen: true,
    products: groceryProducts.slice(0, 12).map(p => ({ ...p, price: Math.round(p.price * 1.05) })),
  },
  {
    shopName: 'MediCare Plus Pharmacy',
    ownerName: 'System',
    category: 'Pharmacy',
    phone: '9000000003',
    address: 'KPHB Colony, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.3996, 17.4933] },
    rating: 4.8,
    deliveryFee: 0,
    isOpen: true,
    products: pharmacyProducts,
  },
  {
    shopName: 'QuickMeds 24/7',
    ownerName: 'System',
    category: 'Pharmacy',
    phone: '9000000004',
    address: 'Kondapur, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.3504, 17.4601] },
    rating: 4.6,
    deliveryFee: 0,
    isOpen: true,
    products: pharmacyProducts.slice(0, 10),
  },
  {
    shopName: 'TechHub Electronics',
    ownerName: 'System',
    category: 'Electronics',
    phone: '9000000005',
    address: 'Ameerpet, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.4483, 17.4375] },
    rating: 4.4,
    deliveryFee: 49,
    isOpen: true,
    products: electronicsProducts,
  },
  {
    shopName: 'Gadget Galaxy',
    ownerName: 'System',
    category: 'Electronics',
    phone: '9000000006',
    address: 'Begumpet, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.4636, 17.4417] },
    rating: 4.3,
    deliveryFee: 49,
    isOpen: false,
    products: electronicsProducts.slice(0, 9),
  },
  {
    shopName: 'Spice Garden Restaurant',
    ownerName: 'System',
    category: 'Food',
    phone: '9000000007',
    address: 'Jubilee Hills, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.4032, 17.4312] },
    rating: 4.9,
    deliveryFee: 29,
    isOpen: true,
    products: foodProducts,
  },
  {
    shopName: 'Street Eats Fast Food',
    ownerName: 'System',
    category: 'Food',
    phone: '9000000008',
    address: 'Banjara Hills, Hyderabad',
    imageUrl: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [78.4421, 17.4122] },
    rating: 4.2,
    deliveryFee: 29,
    isOpen: true,
    products: foodProducts.slice(3, 12),
  },
];

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
    console.log('Connected!');

    // 1. Create a Test Customer
    const customerEmail = 'customer@demo.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      console.log('Creating demo customer...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      customer = await User.create({
        name: 'Demo Customer',
        email: customerEmail,
        password: hashedPassword,
        role: 'customer',
        phone: '9876543210'
      });
      console.log('✅ Created Customer -> Email: customer@demo.com | Password: password123');
    } else {
      console.log('✅ Demo Customer already exists (customer@demo.com / password123)');
    }

    // 2. Create an Admin User
    const adminEmail = 'admin@demo.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Created Admin -> Email: admin@demo.com | Password: password123');
    }

    // 3. Re-seed shops with full product catalog
    console.log('Clearing existing shops and re-seeding with rich data...');
    await Shop.deleteMany({});
    await Shop.insertMany(demoShops);
    console.log(`✅ Seeded ${demoShops.length} shops with full product catalogs`);

    console.log('🎉 Seeding Complete! Run the backend server and enjoy HyperDispatch!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error: ', error);
    process.exit(1);
  }
};

seedData();
