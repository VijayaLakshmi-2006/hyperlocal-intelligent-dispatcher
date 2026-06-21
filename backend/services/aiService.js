import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';

export const parseShoppingPrompt = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBvkS8S9yEjsnsQhmvmysjMOMX-1HzAuog';
  let parsedResult;

  // Fetch full inventory to provide perfect context for the AI
  const allProducts = await Product.find({}).lean();
  const inventoryContext = allProducts.map(p => ({
    name: p.name,
    category: p.category,
    unit: p.unit
  }));

  if (!apiKey) {
    throw new Error('No API Key present in environment');
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `
You are an advanced hyperlocal shopping and health assistant (ChatGPT + Instamart + Zepto + Pharmacy Assistant).
Given the user's input, perform Intent Classification, Entity Extraction, and Product Mapping.

Supported Intents:
"Grocery Purchase" | "Recipe Based Shopping" | "Health & Medical Needs" | "Household Shopping" | "Emergency Shopping" | "Bulk Shopping" | "Party/Event Planning"

Available Inventory (Match ONLY to these exact product names):
${JSON.stringify(inventoryContext)}

Rules:
1. Intent Classification: Decide which of the intents best matches the query. If it's a kitty party or party, select "Party/Event Planning" or "Bulk Shopping". If it's a simple search like "coca cola", select "Grocery Purchase".
2. Entity Extraction: Extract recipe names, serving count, health symptoms, family size, duration, etc., if present. If 6 women, serving count is 6.
3. Product Mapping: Map the user's needs to EXACT product names from the Available Inventory. You MUST return products that are relevant to the intent.
4. If "Health & Medical Needs" (e.g., fever, cold, headache), extract symptoms, map to relevant available medical products (e.g., Paracetamol, ORS, Thermometer, Vicks, Cough Syrup), and ALWAYS include a medicalDisclaimer ("Consult a doctor if symptoms persist.").
5. If "Recipe Based Shopping" or "Party/Event Planning", extract servingCount, and generate necessary ingredients/snacks scaled to the count. For a kitty party, suggest various snacks, biscuits, and beverages from the inventory.
6. Correct spelling mistakes automatically (e.g., "aplles" -> "Apple", "fivver" -> "Fever", "searxh kitty part" -> "Search kitty party").
7. Handle multiple products in one query properly and handle their quantities correctly.
8. If the request is too vague and confidence is low, set clarificationNeeded to true and ask a clarificationQuestion.
9. Return relevant products only. No simple keyword matching - understand the context!

Return ONLY a valid JSON object matching this schema EXACTLY:
{
  "intent": "string (one of the intents)",
  "confidenceScore": "number (0.0 to 1.0)",
  "clarificationNeeded": "boolean",
  "clarificationQuestion": "string (or null)",
  "entities": {
    "recipeName": "string (or null)",
    "servingCount": "number (or null)",
    "healthSymptoms": ["array of strings"],
    "familySize": "number (or null)",
    "duration": "string (or null)",
    "budget": "string (or null)"
  },
  "medicalDisclaimer": "string (or null)",
  "message": "string (A helpful message to the user based on their query)",
  "items": [
    {
      "productName": "Exact name from Available Inventory",
      "quantity": "number (calculated quantity)",
      "unit": "string (e.g., Kg, units, strips)",
      "category": "string"
    }
  ]
}
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request: "${prompt}"` }] }]
    });

    const responseText = result.response.text().trim();
    const match = responseText.match(/\{[\s\S]*\}/);
    const cleanJson = match ? match[0] : responseText;
    parsedResult = JSON.parse(cleanJson);

  } catch (error) {
    console.error('Gemini API call or JSON Parse failed:', error);
    if (error.response) console.error(error.response);
    
    parsedResult = {
      intent: 'Grocery Purchase',
      confidenceScore: 0.1,
      clarificationNeeded: true,
      clarificationQuestion: "I'm having trouble connecting to my AI brain. Could you please specify exactly what you need from the catalog?",
      entities: {},
      message: "AI connection failed. Please search manually.",
      items: [
        { productName: "Atta", quantity: 1, unit: "Kg", category: "Groceries" }
      ],
      isFallback: true,
      error: error.message
    };
  }

  // Map returned products back to database objects
  const enrichedItems = [];
  if (parsedResult.items && parsedResult.items.length > 0) {
    for (const item of parsedResult.items) {
      // Find exact or closest match from the pre-fetched inventory
      let matchedDbProduct = allProducts.find(p => p.name === item.productName);
      if (!matchedDbProduct) {
        matchedDbProduct = allProducts.find(p => p.name.toLowerCase().includes(item.productName.toLowerCase()) || item.productName.toLowerCase().includes(p.name.toLowerCase()));
      }

      if (matchedDbProduct) {
        enrichedItems.push({
          ingredientName: item.productName,
          requiredQuantity: `${item.quantity} ${item.unit}`,
          rawQuantity: item.quantity,
          matchedProduct: {
            id: matchedDbProduct._id,
            name: matchedDbProduct.name,
            price: matchedDbProduct.price,
            discount: matchedDbProduct.discount,
            unit: matchedDbProduct.unit,
            brand: matchedDbProduct.brand,
            image: matchedDbProduct.image,
            stock: matchedDbProduct.stock,
            category: matchedDbProduct.category
          }
        });
      }
    }
  }

  // Overwrite items with enriched details for frontend
  return {
    ...parsedResult,
    category: parsedResult.intent, // Added for UI compatibility
    dish: parsedResult.intent, // Added for UI compatibility
    ingredients: enrichedItems // mapping items to 'ingredients' key for UI mapping
  };
};
