import Shop from "../models/shopModel.js";
import { haversineDistanceMeters, isValidCoordinate } from "../utils/location.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalize = (value) => (value || "").toLowerCase().trim();

const fuzzyPattern = (value) =>
  escapeRegex(value)
    .split(/\s+/)
    .filter(Boolean)
    .join(".*");

const productMatches = (product, keywords, category, budget) => {
  const haystack = normalize(
    `${product.name} ${product.description} ${product.category} ${(product.keywords || []).join(" ")}`
  );

  const keywordMatch = keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) {
      return false;
    }

    return haystack.includes(normalizedKeyword) || new RegExp(fuzzyPattern(normalizedKeyword), "i").test(haystack);
  });

  const categoryMatch = category && normalize(product.category) === normalize(category);
  const budgetMatch = !budget || product.price <= budget;

  return (keywordMatch || categoryMatch) && budgetMatch;
};

const calculateEtaMinutes = (distanceMeters, urgency) => {
  if (!Number.isFinite(distanceMeters)) {
    return urgency === "High" ? 20 : 30;
  }

  const travelMinutes = (distanceMeters / 1000) * 4;
  const bufferMinutes = urgency === "High" ? 8 : 12;
  return Math.max(10, Math.round(travelMinutes + bufferMinutes));
};

const calculateScore = ({ distanceMeters, rating, price, stock, maxDistance, maxPrice }) => {
  const distanceScore = Number.isFinite(distanceMeters)
    ? Math.max(0, 1 - distanceMeters / Math.max(maxDistance, 1))
    : 0.6;
  const ratingScore = Math.min(Number(rating || 0) / 5, 1);
  const priceScore = Math.max(0, 1 - Number(price || 0) / Math.max(maxPrice, 1));
  const availabilityScore = stock > 0 ? 1 : 0;

  return Math.round(
    (distanceScore * 0.4 + ratingScore * 0.25 + priceScore * 0.2 + availabilityScore * 0.15) *
      100
  );
};

export const findCommerceRecommendations = async ({ intent, customerLocation, limit = 5 }) => {
  const keywords = [
    intent.product,
    ...(intent.relatedKeywords || []),
    ...(intent.alternatives || []),
  ].filter(Boolean);

  const searchRegexes = keywords.map((keyword) => new RegExp(fuzzyPattern(keyword), "i"));
  const shopQuery = {
    isOpen: true,
    isActive: true,
    $or: [
      { "products.name": { $in: searchRegexes } },
      { "products.description": { $in: searchRegexes } },
      { "products.keywords": { $in: searchRegexes } },
      { category: new RegExp(escapeRegex(intent.category || ""), "i") },
    ],
  };

  let shopsQuery = Shop.find(shopQuery);
  const hasCustomerLocation = isValidCoordinate(
    customerLocation?.latitude,
    customerLocation?.longitude
  );

  if (hasCustomerLocation) {
    shopsQuery = Shop.find({
      ...shopQuery,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(customerLocation.longitude), Number(customerLocation.latitude)],
          },
          $maxDistance: Number(process.env.SHOP_SEARCH_RADIUS_METERS || 10000),
        },
      },
    });
  }

  const shops = await shopsQuery.limit(30);
  const candidateProducts = [];

  shops.forEach((shop) => {
    shop.products
      .filter((product) => productMatches(product, keywords, intent.category, intent.budget))
      .forEach((product) => {
        const shopLocation = {
          latitude: shop.location.coordinates[1],
          longitude: shop.location.coordinates[0],
        };
        const distanceMeters = hasCustomerLocation
          ? haversineDistanceMeters(customerLocation, shopLocation)
          : null;

        candidateProducts.push({
          id: `${shop._id}:${product._id}`,
          shop: {
            id: shop._id,
            shopName: shop.shopName,
            ownerName: shop.ownerName,
            category: shop.category,
            phone: shop.phone,
            address: shop.address,
            rating: shop.rating,
            location: shopLocation,
          },
          product: {
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
          },
          distanceMeters,
          etaMinutes: calculateEtaMinutes(distanceMeters, intent.urgency),
        });
      });
  });

  const maxDistance = Math.max(
    ...candidateProducts.map((candidate) => candidate.distanceMeters || 0),
    1
  );
  const maxPrice = Math.max(...candidateProducts.map((candidate) => candidate.product.price || 0), 1);

  return candidateProducts
    .map((candidate) => ({
      ...candidate,
      score: calculateScore({
        distanceMeters: candidate.distanceMeters,
        rating: candidate.shop.rating,
        price: candidate.product.price,
        stock: candidate.product.stock,
        maxDistance,
        maxPrice,
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
