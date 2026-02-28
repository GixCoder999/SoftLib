const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const ConnectDB = require("./db.js");
const { Software } = require("./Schema.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

async function startServer() {
  try {
    await ConnectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

Software.create({
    name:"VS Code",
    description:"Coding IDE",
    version:"latest",
    license:"Microsoft",
    repositoryUrl:"whatever"
});

startServer();
