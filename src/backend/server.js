const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const ConnectDB = require("./db.js");
const { Software } = require("./Schema.js");
const { authMiddleware, registerUser, loginUser } = require("./auth.js");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "username, email and password are required" });
  }

  const result = await registerUser(username, email, password);
  return res.status(result.status).json(result);
});

app.post("/signin", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      success: false,
      error: "usernameOrEmail and password are required",
    });
  }

  const result = await loginUser(usernameOrEmail, password);
  if (!result.success) {
    return res.status(result.status).json(result);
  }

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
  });

  return res.status(result.status).json({
    success: true,
    message: result.message,
  });
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
startServer();

app.get("/software", async (req, res) => {
  try {
    const softwareList = await Software.find();
    res.json(softwareList);
  }
  catch (error) {
    console.error("Error fetching software:", error.message);
    res.status(500).json({ error: "Failed to fetch software" });
  }
});

app.get('/software/:id',async (req,res)=>{
  try {
    const softwareId = req.params.id;
    console.log('Fetching software with ID:', softwareId);
    const soft = await Software.findById(softwareId)
    
    if (!soft) {
      return res.status(404).json({ error: "Software not found" });
    }
    res.json(soft);
  }
  catch (error) {
    console.error("Error fetching software:", error.message);
    res.status(500).json({ error: "Failed to fetch software" });
  }
});

const downloadSoftware = async (req, res) => {
  try {
    const softwareId = req.params.id;
    const shouldRedirect = req.query.redirect !== "false";

    if (!mongoose.Types.ObjectId.isValid(softwareId)) {
      return res.status(400).json({ error: "Invalid software id" });
    }

    const software = await Software.findById(softwareId).select("name repositoryUrl");
    if (!software) {
      return res.status(404).json({ error: "Software not found" });
    }

    if (!software.repositoryUrl) {
      return res.status(400).json({ error: "Download link is not available" });
    }

    const downloadUrl = getDropboxDirectDownloadUrl(software.repositoryUrl);
    if (!downloadUrl) {
      return res.status(400).json({
        error: "Invalid Dropbox link. Save a Dropbox share URL in repositoryUrl.",
      });
    }

    if (shouldRedirect) {
      return res.redirect(302, downloadUrl);
    }

    return res.json({
      message: "Download link generated",
      softwareId: software._id,
      name: software.name,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error generating download link:", error.message);
    return res.status(500).json({ error: "Failed to process download request" });
  }
};

app.get("/software/:id/download", authMiddleware, downloadSoftware);

function getDropboxDirectDownloadUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    const isDropboxHost =
      host === "dropbox.com" ||
      host === "www.dropbox.com" ||
      host === "dl.dropboxusercontent.com";

    if (!isDropboxHost) {
      return null;
    }

    if (host === "dl.dropboxusercontent.com") {
      return url.toString();
    }

    url.searchParams.set("dl", "1");
    url.searchParams.delete("raw");
    return url.toString();
  } catch (error) {
    return null;
  }
}
