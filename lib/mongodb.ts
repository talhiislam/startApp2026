import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  // Deferred: only evaluated when actually connecting (not at build time)
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  const dbName = process.env.MONGODB_DB_NAME || "startup-project";

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { dbName });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
