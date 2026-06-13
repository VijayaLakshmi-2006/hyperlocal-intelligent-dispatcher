import Agent from "../models/agentModel.js";
import Order from "../models/orderModel.js";
import SearchLog from "../models/searchLogModel.js";
import Shop from "../models/shopModel.js";
import { analyzeCommerceIntent, recommendAlternatives, generateShoppingList, matchProductsToShops, generateSpendingInsights, detectReorderPatterns } from "../services/aiService.js";
import AIRequest from "../models/aiRequestModel.js";
import { findCommerceRecommendations } from "../services/recommendationService.js";
import {
  getAgentSearchRadiusMeters,
  isValidCoordinate,
  normalizeAddressLocation,
  toGeoPoint,
} from "../utils/location.js";
import { emitSocketEvent } from "../utils/socket.js";

const normalizeCustomerLocation = (body) => {
  const source = body.customerLocation || body.deliveryLocation || body;
  const latitude = source.latitude;
  const longitude = source.longitude;

  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  return {
    address: source.address || body.address || "Customer Location",
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
};

const findClosestAvailableAgent = async (pickupLocation) => {
  const pickupGeoLocation = toGeoPoint(pickupLocation);

  if (!pickupGeoLocation) {
    return null;
  }

  return Agent.findOne({
    isAvailable: true,
    activeOrder: null,
    location: {
      $near: {
        $geometry: pickupGeoLocation,
        $maxDistance: getAgentSearchRadiusMeters(),
      },
    },
  }).populate("user", "name email phone role");
};

const populateCommerceOrder = (query) =>
  query
    .populate("customer", "name email phone role")
    .populate("assignedAgent", "name email phone role")
    .populate("shop", "shopName phone address rating category location");

export const searchCommerce = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        message: "Query is required",
      });
    }

    const customerLocation = normalizeCustomerLocation(req.body);
    const intent = await analyzeCommerceIntent(query.trim());
    const recommendations = await findCommerceRecommendations({
      intent,
      customerLocation,
      limit: 5,
    });

    const alternatives = recommendations.length
      ? intent.alternatives || []
      : recommendAlternatives(intent, intent.product);

    await SearchLog.create({
      user: req.user?._id || null,
      query: query.trim(),
      product: intent.product,
      category: intent.category,
      urgency: intent.urgency,
      budget: intent.budget,
      location: customerLocation ? toGeoPoint(customerLocation) : undefined,
      recommendationCount: recommendations.length,
    });

    res.status(200).json({
      ...intent,
      priority: intent.urgency === "High" ? "HIGH" : "NORMAL",
      customerLocation,
      recommendations,
      alternatives,
      message: recommendations.length
        ? `I found ${recommendations.length} nearby option(s) for ${intent.product}.`
        : `I could not find ${intent.product} nearby. Try these alternatives.`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const createCommerceOrder = async (req, res) => {
  try {
    const {
      shopId,
      productId,
      productName,
      quantity = 1,
      customerLocation,
      deliveryLocation,
      query,
      intent = {},
      paymentMethod = "cash",
    } = req.body;

    const normalizedDelivery = normalizeAddressLocation(
      deliveryLocation || customerLocation,
      customerLocation?.address || deliveryLocation?.address || "Customer Location"
    );

    if (normalizedDelivery.error || !toGeoPoint(normalizedDelivery.value)) {
      return res.status(400).json({
        message: "Delivery address with valid coordinates is required",
      });
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({
        message: "Shop Not Found",
      });
    }

    const product =
      shop.products.id(productId) ||
      shop.products.find((item) => item.name.toLowerCase() === productName?.toLowerCase());

    if (!product) {
      return res.status(404).json({
        message: "Product Not Found In Shop",
      });
    }

    if (product.stock < Number(quantity)) {
      return res.status(400).json({
        message: "Requested product is out of stock",
        alternatives: recommendAlternatives(intent, product.name),
      });
    }

    const pickupLocation = {
      address: shop.address,
      latitude: shop.location.coordinates[1],
      longitude: shop.location.coordinates[0],
    };
    const closestAgent = await findClosestAvailableAgent(pickupLocation);
    const price = Number(product.price) * Number(quantity);
    const priority = intent.urgency === "High" ? "high" : "normal";

    const order = await Order.create({
      customer: req.user._id,
      assignedAgent: closestAgent?.user?._id || null,
      shop: shop._id,
      source: "ai_commerce",
      priority,
      pickupAddress: pickupLocation.address,
      deliveryAddress: normalizedDelivery.value.address,
      pickupLocation,
      deliveryLocation: normalizedDelivery.value,
      pickupGeoLocation: toGeoPoint(pickupLocation),
      deliveryGeoLocation: toGeoPoint(normalizedDelivery.value),
      packageDetails: `${product.name} from ${shop.shopName}`,
      commerceItems: [
        {
          productName: product.name,
          quantity: Number(quantity),
          unitPrice: product.price,
          category: product.category,
        },
      ],
      aiIntent: {
        product: intent.product || product.name,
        category: intent.category || product.category,
        urgency: intent.urgency || "Normal",
        budget: intent.budget || null,
        query,
      },
      price,
      paymentMethod,
      status: closestAgent ? "accepted" : "pending",
    });

    product.stock -= Number(quantity);
    await shop.save();

    const fullOrder = await populateCommerceOrder(Order.findById(order._id));

    emitSocketEvent("orderCreated", { order: fullOrder }, [
      "admin:dashboard",
      `order:${order._id}`,
    ]);

    if (closestAgent) {
      closestAgent.isAvailable = false;
      closestAgent.activeOrder = order._id;
      await closestAgent.save();

      const assignmentPayload = {
        order: fullOrder,
        agentId: closestAgent._id,
        agentUserId: closestAgent.user._id,
      };

      emitSocketEvent("orderAssigned", assignmentPayload, [
        "admin:dashboard",
        `order:${order._id}`,
      ]);
      emitSocketEvent("agentAssigned", assignmentPayload, [
        "admin:dashboard",
        `order:${order._id}`,
      ]);
    }

    res.status(201).json({
      message: closestAgent
        ? "AI commerce order created and assigned"
        : "AI commerce order created, no nearby agent available",
      order: fullOrder,
      assignment: {
        agent: closestAgent,
        radiusMeters: getAgentSearchRadiusMeters(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAIAnalytics = async (req, res) => {
  try {
    const [products, categories, highDemandLocations, peakHours, topAgents] =
      await Promise.all([
        SearchLog.aggregate([
          { $match: { product: { $ne: "" } } },
          { $group: { _id: "$product", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        SearchLog.aggregate([
          { $match: { category: { $ne: "" } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        SearchLog.aggregate([
          { $match: { "location.coordinates": { $exists: true } } },
          {
            $project: {
              lngBucket: { $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 2] },
              latBucket: { $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 2] },
            },
          },
          { $group: { _id: { lat: "$latBucket", lng: "$lngBucket" }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Order.aggregate([
          { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Agent.find().sort({ totalDeliveries: -1 }).limit(10).populate("user", "name email phone"),
      ]);

    res.status(200).json({
      mostSearchedProducts: products,
      mostSearchedCategories: categories,
      highDemandLocations,
      peakDeliveryHours: peakHours,
      topPerformingAgents: topAgents,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: AI CART BUILDER CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export const buildAICart = async (req, res) => {
  try {
    const { query, location } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: "Query is required and must be a string" });
    }

    // Parse user location if provided
    let userLocation = null;
    if (location && location.lat && location.lng) {
      userLocation = { latitude: location.lat, longitude: location.lng };
    }

    // Step 1: Ask Gemini/OpenAI/Fallback to generate a structured shopping list
    const aiResult = await generateShoppingList(query.trim());
    const aiProducts = aiResult.products || [];

    if (aiProducts.length === 0) {
      return res.status(422).json({ message: "Could not generate a shopping list from your query. Please be more specific." });
    }

    // Step 2: Match AI products to real shop database and calculate ETA
    const { shop, cartItems, total, eta } = await matchProductsToShops(aiProducts, userLocation);

    // Step 3: Save the AI request to history
    if (req.user?._id) {
      await AIRequest.create({
        userId: req.user._id,
        prompt: query.trim(),
        generatedCart: cartItems,
        shop: shop ? { id: shop._id.toString(), name: shop.shopName } : {},
        totalCost: total,
        estimatedTime: eta,
      });
    }

    // Formatted response exactly as requested:
    res.status(200).json({
      success: true,
      store: shop ? shop.shopName : "Unknown Store",
      shopId: shop ? shop._id : null,
      eta: eta,
      total: total,
      items: cartItems.map(item => ({
        id: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        unavailable: item.unavailable || false
      }))
    });
  } catch (error) {
    console.error("[buildAICart]", error);
    res.status(500).json({ message: error.stack || error.message || "Internal Server Error" });
  }
};

export const addAICartToOrder = async (req, res) => {
  // This endpoint validates cart items and returns them ready for the frontend Cart context
  // The actual cart state lives in the frontend (localStorage) - we just validate here
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required" });
    }

    // Filter to only real (available) items with a productId
    const validItems = items.filter((item) => item.productId);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.status(200).json({
      success: true,
      message: `${validItems.length} items ready to add to cart`,
      items,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSpendingInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      customer: userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const totalSpent = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    const orderCount = orders.length;

    // Build category breakdown from packageDetails heuristic
    const categoryBreakdown = {};
    for (const order of orders) {
      const details = (order.packageDetails || "").toLowerCase();
      let cat = "General";
      if (details.includes("snack") || details.includes("chips") || details.includes("cola")) cat = "Snacks";
      else if (details.includes("medicine") || details.includes("tablet") || details.includes("syrup")) cat = "Medicine";
      else if (details.includes("grocery") || details.includes("rice") || details.includes("milk")) cat = "Groceries";
      else if (details.includes("food") || details.includes("biryani") || details.includes("chicken")) cat = "Food";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (order.price || 0);
    }

    // Ask Gemini to generate insights
    const insights = await generateSpendingInsights({ totalSpent, orderCount, categoryBreakdown });

    res.status(200).json({ success: true, totalSpent, orderCount, insights });
  } catch (error) {
    console.error("[getSpendingInsights]", error.message);
    // Return fallback if Gemini fails
    res.status(200).json({
      success: true,
      totalSpent: 0,
      orderCount: 0,
      insights: {
        summary: "No orders this month yet.",
        categories: [],
        topInsight: "Start ordering to see your spending insights!",
        savingsTip: "Order in bulk to save on delivery fees.",
        potentialSavings: 0,
      },
    });
  }
};

export const getSmartReorder = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ customer: userId }).sort({ createdAt: -1 }).limit(20);
    const { recurring, lastOrderedDaysAgo } = detectReorderPatterns(orders);

    res.status(200).json({
      success: true,
      recurring,
      lastOrderedDaysAgo,
      hasHistory: orders.length > 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
