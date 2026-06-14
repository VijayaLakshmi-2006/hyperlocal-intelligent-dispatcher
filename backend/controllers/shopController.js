import Shop from "../models/shopModel.js";
import { isValidCoordinate } from "../utils/location.js";

export const createShop = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      category,
      phone,
      address,
      latitude,
      longitude,
      rating,
      products = [],
    } = req.body;

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    const shop = await Shop.create({
      shopName,
      ownerName,
      category,
      phone,
      address,
      rating,
      products,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    res.status(201).json({
      message: "Shop Created Successfully",
      shop,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getShops = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    let query = { isActive: true };

    // Geolocation filter
    if (lat && lng) {
      const maxDistance = radius ? Number(radius) * 1000 : 5000; // Default 5km radius
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: maxDistance,
        },
      };
      
      // $near automatically sorts by distance, so we don't apply an explicit sort here.
      const shops = await Shop.find(query);
      return res.status(200).json(shops);
    }

    // Default fallback if no location provided
    const shops = await Shop.find(query).sort({ rating: -1, createdAt: -1 });
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const seedDemoShops = async (req, res) => {
  try {
    const demoShops = [
      {
        shopName: "Miyapur MedPlus",
        ownerName: "Ravi Kumar",
        category: "Medicine",
        phone: "9000000001",
        address: "Miyapur Main Road, Hyderabad",
        rating: 4.7,
        location: { type: "Point", coordinates: [78.3618, 17.4969] },
        products: [
          { name: "Paracetamol", description: "Fever and pain relief tablet", price: 35, stock: 25, category: "Medicine", keywords: ["dolo", "crocin", "calpol", "fever"] },
          { name: "Dolo 650", description: "Paracetamol 650mg", price: 38, stock: 18, category: "Medicine", keywords: ["paracetamol", "fever"] },
        ],
      },
      {
        shopName: "KPHB Digital Hub",
        ownerName: "Sneha Reddy",
        category: "Electronics",
        phone: "9000000002",
        address: "KPHB Colony, Hyderabad",
        rating: 4.4,
        location: { type: "Point", coordinates: [78.3996, 17.4933] },
        products: [
          { name: "Laptop Charger", description: "Universal 65W laptop adapter", price: 1200, stock: 8, category: "Electronics", keywords: ["adapter", "charger"] },
          { name: "Headphones", description: "Wired headphones with mic", price: 799, stock: 14, category: "Electronics", keywords: ["earphones", "headset"] },
        ],
      },
      {
        shopName: "Exam Ready Stationery",
        ownerName: "Asha Mehta",
        category: "Stationery",
        phone: "9000000003",
        address: "JNTU Road, Hyderabad",
        rating: 4.6,
        location: { type: "Point", coordinates: [78.3915, 17.4950] },
        products: [
          { name: "Notebook", description: "Long ruled notebook", price: 65, stock: 40, category: "Stationery", keywords: ["classmate", "exam", "register"] },
          { name: "Blue Pen Pack", description: "Pack of 5 blue pens", price: 50, stock: 35, category: "Stationery", keywords: ["pen", "exam"] },
        ],
      },
    ];

    await Shop.deleteMany({ shopName: { $in: demoShops.map((shop) => shop.shopName) } });
    const shops = await Shop.insertMany(demoShops);

    res.status(201).json({
      message: "Demo shops seeded",
      count: shops.length,
      shops,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
