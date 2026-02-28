const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const uri = process.env.MONGODB_URI;
const db = mongoose.connection;

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables.");
}

async function ConnectDB() {
    await mongoose.connect(uri,{
        dbName:"SoftLib"
    });
    console.log("MongoDB connected");
}

module.exports = ConnectDB;
