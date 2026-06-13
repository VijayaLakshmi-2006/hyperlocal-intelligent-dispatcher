import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  {
    _id: true,
  }
);

const shopSchema = new Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4,
    },
    products: {
      type: [productSchema],
      default: [],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

shopSchema.index({ location: "2dsphere" });
shopSchema.index({ shopName: "text", category: "text", "products.name": "text", "products.description": "text", "products.keywords": "text" });
shopSchema.index({ category: 1, isOpen: 1, isActive: 1 });

const Shop = model("Shop", shopSchema);

export default Shop;
