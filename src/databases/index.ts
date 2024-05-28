import consola from "consola";
import mongoose from "mongoose";

let instance: typeof mongoose | undefined;
export const connectMongoDB = async () => {
  if (!instance && !!process.env.MONGO_URI) {
    try {
      consola.info(
        `Connecting to MongoDB with uri: \`${process.env.MONGO_URI}\`...`,
      );
      instance = await mongoose.connect(process.env.MONGO_URI);
      consola.success("Connect to MongoDB successfully.");
    } catch (err: unknown) {
      throw new Error(`Connect to MongoDB failed:\n${String(err)}`);
    }
  }
  return instance;
};

export default connectMongoDB;
