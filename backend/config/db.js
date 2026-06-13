import mongoose from "mongoose";

const connectDB =  async() => {
  try {
     await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log("DB Connection Error:", error.message);
  }
};
export default connectDB;
