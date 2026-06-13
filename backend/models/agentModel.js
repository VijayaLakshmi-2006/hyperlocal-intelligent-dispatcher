import { Schema, model, Types } from "mongoose";

const agentSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    currentLocation: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    location: {
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

    activeOrder: {
      type: Types.ObjectId,
      ref: "Order",
      default: null,
    },

    totalDeliveries: {
      type: Number,
      default: 0,
    },

    vehicleType: {
      type: String,

      enum: ["bike", "scooter", "car"],

      default: "bike",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

agentSchema.index({ location: "2dsphere" });
agentSchema.index({ user: 1 }, { unique: true });
agentSchema.index({ isAvailable: 1, activeOrder: 1 });

const Agent = model("Agent", agentSchema);

export default Agent;
