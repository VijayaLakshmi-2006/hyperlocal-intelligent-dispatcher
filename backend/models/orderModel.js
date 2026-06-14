import { Schema, model, Types } from "mongoose";

const addressLocationSchema = new Schema(
  {
    address: { type: String, trim: true, default: "" }, // Legacy
    fullAddress: { type: String, trim: true, default: "" },
    flatNumber: { type: String, trim: true, default: "" },
    apartmentName: { type: String, trim: true, default: "" },
    streetName: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  {
    _id: false,
  }
);

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new Schema(
  {
    customer: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAgent: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },

    shop: {
      type: Types.ObjectId,
      ref: "Shop",
      default: null,
    },

    source: {
      type: String,
      enum: ["manual", "ai_commerce"],
      default: "manual",
    },

    priority: {
      type: String,
      enum: ["normal", "high"],
      default: "normal",
    },

    pickupAddress: {
      type: String,
      trim: true,
    },

    deliveryAddress: {
      type: String,
      trim: true,
    },

    pickupLocation: {
      type: addressLocationSchema,
      default: undefined,
    },

    deliveryLocation: {
      type: addressLocationSchema,
      default: undefined,
    },

    pickupGeoLocation: {
      type: geoPointSchema,
      default: undefined,
    },

    deliveryGeoLocation: {
      type: geoPointSchema,
      default: undefined,
    },

    packageDetails: {
      type: String,
      required: true,
      trim: true,
    },

    commerceItems: [
      {
        productName: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: {
          type: Number,
          default: 0,
        },
        category: {
          type: String,
          trim: true,
        },
      },
    ],

    aiIntent: {
      product: {
        type: String,
        trim: true,
      },
      category: {
        type: String,
        trim: true,
      },
      urgency: {
        type: String,
        enum: ["Low", "Normal", "High"],
        default: "Normal",
      },
      budget: {
        type: Number,
        default: null,
      },
      query: {
        type: String,
        trim: true,
      },
    },

    price: {
      type: Number,
      required: true,
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "AGENT_ASSIGNED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED"
      ],
      default: "PLACED",
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    deliveryAgent: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    agentName: {
      type: String,
      trim: true,
    },
    agentPhone: {
      type: String,
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

orderSchema.index({ pickupGeoLocation: "2dsphere" });
orderSchema.index({ deliveryGeoLocation: "2dsphere" });

const Order = model("Order", orderSchema);

export default Order;
