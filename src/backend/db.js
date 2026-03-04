const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const db = mongoose.connection;

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables.");
}
if (!dbName) {
  throw new Error("Missing MONGODB_DB_NAME in environment variables.");
}

async function ConnectDB() {
  await mongoose.connect(uri, {
    dbName
  });
  console.log("MongoDB connected");
}

module.exports = ConnectDB;
