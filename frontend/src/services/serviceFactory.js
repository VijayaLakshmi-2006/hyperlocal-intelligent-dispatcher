// src/services/serviceFactory.js
import { config } from '../config';
import { orderAPI as realOrderAPI, shopAPI as realShopAPI } from './api';
import { mockOrderAPI, mockShopAPI } from './mockOrderService';

console.log(`[ServiceFactory] USE_BACKEND is set to: ${config.USE_BACKEND}`);

export const orderService = config.USE_BACKEND ? realOrderAPI : mockOrderAPI;
export const shopService = config.USE_BACKEND ? realShopAPI : mockShopAPI;

// Re-export auth from api since Auth usually still requires a real JWT for now,
// or you could mock it too if desired.
export { authAPI, analyticsAPI } from './api';
