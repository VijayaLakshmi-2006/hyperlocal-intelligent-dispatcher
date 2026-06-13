// src/services/mockOrderService.js
import { DEMO_STORES, DEMO_AGENT } from './mockData';

// Helper to delay responses slightly for realism
const delay = (ms) => new Promise(res => setTimeout(res, ms));

const getStorageOrders = () => {
  try {
    return JSON.parse(localStorage.getItem('hd_demo_orders') || '[]');
  } catch {
    return [];
  }
};

const saveStorageOrders = (orders) => {
  localStorage.setItem('hd_demo_orders', JSON.stringify(orders));
};

export const mockOrderAPI = {
  createOrder: async (data) => {
    await delay(800);
    const newOrder = {
      ...data,
      _id: `ord_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      // In demo mode, we auto-assign immediately for tracking
      assignedAgent: DEMO_AGENT.user,
    };
    
    // Quick auto-accept simulation
    setTimeout(() => {
      const orders = getStorageOrders();
      const idx = orders.findIndex(o => o._id === newOrder._id);
      if (idx > -1) {
        orders[idx].status = 'accepted';
        saveStorageOrders(orders);
      }
    }, 3000);

    const orders = getStorageOrders();
    orders.push(newOrder);
    saveStorageOrders(orders);

    return { data: { message: "Mock Order Created", order: newOrder } };
  },

  getMyOrders: async () => {
    await delay(500);
    return { data: getStorageOrders() };
  },

  getAgentOrders: async () => {
    await delay(500);
    return { data: getStorageOrders() };
  },

  trackOrder: async (orderId) => {
    await delay(400);
    const order = getStorageOrders().find(o => o._id === orderId);
    if (!order) throw new Error("Order not found");

    // Start agent at pickup location
    const agentLocation = {
      latitude: order.pickupLocation.latitude,
      longitude: order.pickupLocation.longitude,
      lastUpdated: new Date()
    };

    return {
      data: {
        order,
        agent: { ...DEMO_AGENT, currentLocation: agentLocation },
        socketRoom: `demo_order_${orderId}`
      }
    };
  },

  updateStatus: async (orderId, status) => {
    await delay(500);
    const orders = getStorageOrders();
    const idx = orders.findIndex(o => o._id === orderId);
    if (idx > -1) {
      orders[idx].status = status;
      saveStorageOrders(orders);
      return { data: { message: "Status updated", order: orders[idx] } };
    }
    throw new Error("Order not found");
  }
};

export const mockShopAPI = {
  getShops: async () => {
    await delay(600);
    return { data: DEMO_STORES };
  }
};
