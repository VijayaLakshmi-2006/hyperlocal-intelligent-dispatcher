// backend/services/aiService.js
// Unified AI service - preserves existing search/intent analysis AND adds new cart builder
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CART_BUILDER_SYSTEM_PROMPT,
  SPENDING_INSIGHTS_SYSTEM_PROMPT,
} from "./aiPrompt.js";
import Shop from "../models/shopModel.js";
import { haversineDistanceMeters } from "../utils/location.js";

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING COMMERCE INTENT LOGIC (preserved for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

const COMMERCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    product: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    urgency: { type: "string", enum: ["Low", "Normal", "High"] },
    budget: { type: ["number", "null"] },
    quantity: { type: ["number", "null"] },
    preferences: { type: "array", items: { type: "string" } },
    relatedKeywords: { type: "array", items: { type: "string" } },
    alternatives: { type: "array", items: { type: "string" } },
  },
  required: ["product", "category", "urgency", "budget", "quantity", "preferences", "relatedKeywords", "alternatives"],
};

const categoryKeywords = [
  { category: "Medicine", words: ["medicine", "fever", "paracetamol", "dolo", "crocin", "calpol", "tablet", "pain", "cough", "cold"] },
  { category: "Electronics", words: ["charger", "headphone", "earphone", "laptop", "phone", "cable", "adapter", "mouse", "keyboard"] },
  { category: "Stationery", words: ["notebook", "pen", "pencil", "exam", "file", "paper", "marker"] },
  { category: "Grocery", words: ["milk", "bread", "rice", "atta", "oil", "sugar", "snack", "water"] },
  { category: "Gifts", words: ["gift", "birthday", "toy", "flower", "chocolate", "card"] },
];

const relatedKeywordMap = {
  paracetamol: ["paracetamol", "dolo", "dolo 650", "crocin", "calpol", "acetaminophen"],
  fever: ["paracetamol", "dolo", "crocin", "calpol", "thermometer"],
  charger: ["charger", "adapter", "cable", "type c", "usb-c", "lightning"],
  headphones: ["headphones", "earphones", "headset", "earbuds"],
  notebook: ["notebook", "classmate", "register", "long book"],
  gift: ["gift", "chocolate", "flowers", "toy", "greeting card"],
};

const detectUrgency = (query) => {
  const urgentWords = ["urgent", "urgently", "immediately", "as soon as possible", "asap", "emergency", "right now", "quick"];
  return urgentWords.some((w) => query.toLowerCase().includes(w)) ? "High" : "Normal";
};

const extractBudget = (query) => {
  const normalized = query.replace(/₹|rs\.?|inr/gi, "");
  const match = normalized.match(/(?:under|below|less than|max|maximum|budget)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const extractQuantity = (query) => {
  const match = query.match(/\b(\d+)\s*(pcs|pieces|packs|pack|units|unit|bottles|tabs|tablets)?\b/i);
  return match ? Number(match[1]) : 1;
};

const inferCategory = (query) => {
  const normalized = query.toLowerCase();
  const match = categoryKeywords.find((item) => item.words.some((w) => normalized.includes(w)));
  return match?.category || "General";
};

const inferProduct = (query) => {
  const normalized = query.toLowerCase();
  const fillerWords = ["i", "need", "want", "please", "urgent", "urgently", "immediately", "under", "below", "near", "me", "for", "a", "an", "the", "tomorrow", "today"];
  const alias = Object.keys(relatedKeywordMap).find((key) => normalized.includes(key));
  if (alias) return alias === "fever" ? "Paracetamol" : alias.replace(/\b\w/g, (c) => c.toUpperCase());
  const words = normalized.replace(/₹|rs\.?|inr|\d+/gi, "").split(/\s+/).map((w) => w.trim()).filter((w) => w && !fillerWords.includes(w));
  return words.slice(0, 3).join(" ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Requested Product";
};

const buildFallbackIntent = (query) => {
  const product = inferProduct(query);
  const productKey = product.toLowerCase();
  const relatedKey = Object.keys(relatedKeywordMap).find((k) => productKey.includes(k)) || Object.keys(relatedKeywordMap).find((k) => query.toLowerCase().includes(k));
  return {
    product,
    category: inferCategory(query),
    urgency: detectUrgency(query),
    budget: extractBudget(query),
    quantity: extractQuantity(query),
    preferences: query.toLowerCase().includes("near me") ? ["nearby"] : [],
    relatedKeywords: relatedKeywordMap[relatedKey] || [product],
    alternatives: relatedKeywordMap[relatedKey]?.filter((item) => item.toLowerCase() !== productKey) || [],
    source: "fallback",
  };
};

const parseOutputText = (data) => {
  if (data.output_text) return data.output_text;
  const textPart = data.output?.flatMap((item) => item.content || [])?.find((content) => content.type === "output_text");
  return textPart?.text || "";
};

export const analyzeCommerceIntent = async (query) => {
  if (!process.env.OPENAI_API_KEY) return buildFallbackIntent(query);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "llama3-8b-8192",
        messages: [{ role: "system", content: "Extract hyperlocal commerce intent. Return concise normalized product data, urgency, budget, quantity, useful product keywords, and safe alternatives. Respond ONLY with JSON matching this schema: " + JSON.stringify(COMMERCE_SCHEMA) }, { role: "user", content: query }],
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error(`Groq request failed with ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return { ...buildFallbackIntent(query), ...parsed, product: parsed.product || buildFallbackIntent(query).product, category: parsed.category || buildFallbackIntent(query).category, urgency: parsed.urgency || detectUrgency(query), source: "openai" };
  } catch (error) {
    return { ...buildFallbackIntent(query), source: "fallback", aiError: error.message };
  }
};

export const recommendAlternatives = (intent, unavailableProduct = "") => {
  const key = (unavailableProduct || intent.product || "").toLowerCase();
  const relatedKey = Object.keys(relatedKeywordMap).find((item) => key.includes(item)) || Object.keys(relatedKeywordMap).find((item) => intent.relatedKeywords?.join(" ").toLowerCase().includes(item));
  return intent.alternatives?.length ? intent.alternatives : relatedKeywordMap[relatedKey]?.filter((item) => item.toLowerCase() !== key) || [];
};

// ─────────────────────────────────────────────────────────────────────────────
// AI CART BUILDER — Gemini → OpenAI → local fallback
// ─────────────────────────────────────────────────────────────────────────────

let genAI;

const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('#') || apiKey === 'your_gemini_api_key_here') return null;
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Helper: call OpenAI Chat Completions and return parsed JSON text.
 */
const callOpenAI = async (systemPrompt, userMessage) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${err?.error?.message || response.statusText}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

/**
 * Local keyword fallback — builds a basic shopping list without any AI.
 */
const buildLocalShoppingList = (userPrompt) => {
  const lower = userPrompt.toLowerCase();
  const products = [];
  const commonItems = [
    { keywords: ['milk'], name: 'Amul Milk 500ml', price: 30 },
    { keywords: ['bread'], name: 'Britannia Bread', price: 40 },
    { keywords: ['egg', 'eggs'], name: 'Eggs (6 pack)', price: 60 },
    { keywords: ['rice', 'atta', 'flour'], name: 'Aashirvaad Atta 1kg', price: 65 },
    { keywords: ['sugar'], name: 'Sugar 1kg', price: 45 },
    { keywords: ['oil', 'sunflower'], name: 'Sunflower Oil 1L', price: 130 },
    { keywords: ['water', 'mineral'], name: 'Bisleri Water 1L', price: 20 },
    { keywords: ['chips', 'lays', 'snack'], name: 'Lays Chips', price: 20 },
    { keywords: ['cola', 'pepsi', 'coke', 'soda'], name: 'Pepsi 500ml', price: 30 },
    { keywords: ['biscuit', 'parle', 'oreo'], name: 'Parle-G Biscuits', price: 10 },
    { keywords: ['soap', 'bathing'], name: 'Lifebuoy Soap', price: 25 },
    { keywords: ['shampoo'], name: 'Head & Shoulders Shampoo', price: 150 },
    { keywords: ['toothpaste', 'paste'], name: 'Colgate Toothpaste', price: 55 },
    { keywords: ['chocolate', 'dairy milk'], name: 'Dairy Milk Chocolate', price: 40 },
    { keywords: ['paracetamol', 'fever', 'medicine', 'tablet'], name: 'Crocin 650mg (strip)', price: 25 },
    { keywords: ['notebook', 'pen', 'pencil', 'stationery'], name: 'Notebook 200 pages', price: 60 },
    { keywords: ['onion', 'tomato', 'vegetable', 'veggie'], name: 'Mixed Vegetables 500g', price: 40 },
    { keywords: ['banana', 'fruit'], name: 'Bananas (dozen)', price: 50 },
  ];

  for (const item of commonItems) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      products.push({ name: item.name, quantity: 1, estimatedPrice: item.price });
    }
  }

  // If nothing matched, add a generic placeholder
  if (products.length === 0) {
    products.push({ name: 'General Items', quantity: 1, estimatedPrice: 100 });
  }

  const total = products.reduce((s, p) => s + p.estimatedPrice * p.quantity, 0);
  return { products, totalEstimatedCost: total, source: 'local_fallback' };
};

/**
 * Call Gemini / OpenAI / local fallback to parse a shopping request.
 */
export const generateShoppingList = async (userPrompt) => {
  console.log('[generateShoppingList] Received prompt:', userPrompt);

  // ── 1. Try Gemini if key is present ──────────────────────────────────────
  const geminiClient = getGeminiClient();
  if (geminiClient) {
    try {
      console.log('[generateShoppingList] Trying Gemini gemini-1.5-flash...');
      const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fullPrompt = `${CART_BUILDER_SYSTEM_PROMPT}\n\nUser request: "${userPrompt}"`;
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text().trim();
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(clean);
      console.log('[generateShoppingList] Gemini success, items:', parsed.products?.length);
      return parsed;
    } catch (err) {
      console.warn('[generateShoppingList] Gemini failed, trying OpenAI:', err.message);
    }
  }

  // ── 2. Try OpenAI Chat Completions ───────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[generateShoppingList] Trying OpenAI gpt-4o-mini...');
      const text = await callOpenAI(CART_BUILDER_SYSTEM_PROMPT, `User request: "${userPrompt}"`);
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(clean);
      console.log('[generateShoppingList] OpenAI success, items:', parsed.products?.length);
      return parsed;
    } catch (err) {
      console.warn('[generateShoppingList] OpenAI failed, using local fallback:', err.message);
    }
  }

  // ── 3. Local keyword-based fallback ──────────────────────────────────────
  console.log('[generateShoppingList] Using local keyword fallback.');
  return buildLocalShoppingList(userPrompt);
};

/**
 * Match AI-generated product names against the real Shop database.
 */
export const matchProductsToShops = async (aiProducts, userLocation) => {
  const shops = await Shop.find({ isOpen: true, isActive: true });
  if (shops.length === 0) return { shop: null, cartItems: [], total: 0, coverage: 0, eta: "15-20 mins" };

  let bestShop = null, bestCart = [], bestTotal = 0, bestCoverage = 0;

  for (const shop of shops) {
    const cartItems = [];
    let total = 0, matched = 0;

    for (const aiProduct of aiProducts) {
      const keywords = aiProduct.name.toLowerCase().split(" ").filter((w) => w.length > 2);
      const found = shop.products.find((p) => {
        const productName = p.name.toLowerCase();
        return keywords.some((kw) => productName.includes(kw));
      });

      if (found && found.stock > 0) {
        matched++;
        const qty = aiProduct.quantity || 1;
        cartItems.push({ productId: found._id.toString(), shopId: shop._id.toString(), name: found.name, price: found.price, quantity: qty, category: found.category });
        total += found.price * qty;
      } else {
        cartItems.push({ productId: undefined, shopId: undefined, name: aiProduct.name, price: aiProduct.estimatedPrice || 0, quantity: aiProduct.quantity || 1, category: "general", unavailable: true });
        total += (aiProduct.estimatedPrice || 0) * (aiProduct.quantity || 1);
      }
    }

    const coverage = matched / aiProducts.length;
    if (coverage > bestCoverage || (coverage === bestCoverage && total < bestTotal)) {
      bestShop = shop; bestCart = cartItems; bestTotal = total; bestCoverage = coverage;
    }
  }

  if (!bestShop) bestShop = shops[0];

  let eta = "15-20 mins";
  if (userLocation && bestShop && bestShop.location?.coordinates) {
    const shopLocation = {
      longitude: bestShop.location.coordinates[0],
      latitude: bestShop.location.coordinates[1]
    };
    const distanceMeters = haversineDistanceMeters(userLocation, shopLocation);
    if (distanceMeters < 1000) eta = "5-8 mins";
    else if (distanceMeters < 3000) eta = "8-12 mins";
    else if (distanceMeters < 5000) eta = "12-15 mins";
    else eta = "15+ mins";
  } else {
    eta = bestShop ? `${Math.floor(Math.random() * 5) + 8} mins` : "15-20 mins";
  }

  return { shop: bestShop, cartItems: bestCart, total: bestTotal, coverage: bestCoverage, eta };
};

export const generateSpendingInsights = async (spendingData) => {
  console.log('[generateSpendingInsights] Starting generation...');
  const prompt = `${SPENDING_INSIGHTS_SYSTEM_PROMPT}\n\nUser spending data:\n- Total spent this month: ₹${spendingData.totalSpent}\n- Number of orders: ${spendingData.orderCount}\n- Category breakdown: ${JSON.stringify(spendingData.categoryBreakdown)}`;

  // ── 1. Try Gemini ──────────────────────────────────────────────────────────
  const geminiClient = getGeminiClient();
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      console.warn('[generateSpendingInsights] Gemini failed, trying OpenAI:', err.message);
    }
  }

  // ── 2. Try OpenAI ──────────────────────────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await callOpenAI(
        SPENDING_INSIGHTS_SYSTEM_PROMPT,
        `User spending data:\n- Total spent this month: ₹${spendingData.totalSpent}\n- Number of orders: ${spendingData.orderCount}\n- Category breakdown: ${JSON.stringify(spendingData.categoryBreakdown)}`
      );
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      console.warn('[generateSpendingInsights] OpenAI failed, using static fallback:', err.message);
    }
  }

  // ── 3. Static fallback ─────────────────────────────────────────────────────
  console.error('[generateSpendingInsights] All AI providers failed, using static fallback.');
  return {
    summary: `You spent ₹${spendingData.totalSpent} across ${spendingData.orderCount} orders this month.`,
    categories: [],
    topInsight: 'Keep ordering from local stores to support your community!',
    savingsTip: 'Try ordering weekly groceries in bulk to save on delivery fees.',
    potentialSavings: Math.round(spendingData.totalSpent * 0.1),
  };
};


/**
 * Detect recurring order patterns for smart reorder suggestions.
 */
export const detectReorderPatterns = (orders) => {
  const packageCounts = {};
  for (const order of orders) {
    const key = order.packageDetails?.trim().toLowerCase();
    if (!key) continue;
    packageCounts[key] = (packageCounts[key] || 0) + 1;
  }
  const recurring = Object.entries(packageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const lastOrder = sortedOrders[0];
  const daysSinceLast = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)) : null;
  return { recurring, lastOrderedDaysAgo: daysSinceLast, lastOrder };
};
