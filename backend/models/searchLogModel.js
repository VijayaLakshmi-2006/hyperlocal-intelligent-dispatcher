import { Schema, model } from "mongoose";

const searchLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
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
    recommendationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

searchLogSchema.index({ createdAt: -1 });
searchLogSchema.index({ product: 1, category: 1 });
searchLogSchema.index({ location: "2dsphere" });

const SearchLog = model("SearchLog", searchLogSchema);

export default SearchLog;
