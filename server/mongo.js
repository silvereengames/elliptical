import { MongoClient } from "mongodb"
import { password } from "./functions.js"

const client = new MongoClient(
  process.argv[2] == "Docker"
    ? "mongodb://mongodb:27017"
    : "mongodb://127.0.0.1:27017"
)

const db = client.db("elliptical")
export const rooms = db.collection("rooms")
export const adminpass = db.collection("admin-password")
export const reports = db.collection("reports")

// Connect to the database
export async function initializeDB() {
  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")
    // Import password function only after DB connection
    await password()
  } catch (error) {
    console.error("❌ Error connecting to MongoDB", error)
  }
}
