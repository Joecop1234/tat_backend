import { MongoClient, Db, Collection } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const client = new MongoClient(MONGODB_URI);

let db: Db;
let isConnected = false;

export async function connectDB(): Promise<Db> {
  if (!isConnected) {
    await client.connect();
    db = client.db("tat_system");
    isConnected = true;
    console.log("Connected to MongoDB");
  }
  return db;
}
