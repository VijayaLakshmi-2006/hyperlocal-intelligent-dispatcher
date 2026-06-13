import mongoose from "mongoose";

const aiRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    generatedCart: {
      type: [
        {
          productId: { type: String },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true },
          shopId: { type: String },
        },
      ],
      default: [],
    },
    shop: {
      id: { type: String },
      name: { type: String },
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    estimatedTime: {
      type: String,
      default: "15-20 mins",
    },
  },
  {
    timestamps: true,
  }
);

const AIRequest = mongoose.model("AIRequest", aiRequestSchema);
export default AIRequest;
