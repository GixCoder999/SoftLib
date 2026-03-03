const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const ConnectDB = require("./db.js");
const { Software, SoftwareStats } = require("./Schema.js");
const { registerUser, loginUser } = require("./auth.js");

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
    const softwareList = await Software.find().lean();
    const softwareIds = softwareList.map((software) => software._id);
    const statsList = await SoftwareStats.find({ softwareId: { $in: softwareIds } }).lean();
    const statsBySoftwareId = new Map(
      statsList.map((stats) => [stats.softwareId.toString(), stats])
    );

    const enrichedSoftwareList = softwareList.map((software) => {
      const stats = statsBySoftwareId.get(software._id.toString());
      return {
        ...software,
        review: stats?.review ?? 0,
        downloads: stats?.downloads ?? 0,
      };
    });

    res.json(enrichedSoftwareList);
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
    const soft = await Software.findById(softwareId).lean();
    
    if (!soft) {
      return res.status(404).json({ error: "Software not found" });
    }

    const stats = await SoftwareStats.findOne({ softwareId: soft._id }).lean();
    res.json({
      ...soft,
      review: stats?.review ?? 0,
      downloads: stats?.downloads ?? 0,
    });
  }
  catch (error) {
    console.error("Error fetching software:", error.message);
    res.status(500).json({ error: "Failed to fetch software" });
  }
});

app.post("/software/:id/review", async (req, res) => {
  try {
    const softwareId = req.params.id;
    const rawReview = Number(req.body?.review);

    if (!mongoose.Types.ObjectId.isValid(softwareId)) {
      return res.status(400).json({ error: "Invalid software id" });
    }

    if (!Number.isFinite(rawReview) || rawReview < 1 || rawReview > 5) {
      return res.status(400).json({ error: "Review must be a number between 1 and 5" });
    }

    const software = await Software.findById(softwareId).select("_id");
    if (!software) {
      return res.status(404).json({ error: "Software not found" });
    }

    const roundedReview = Math.round(rawReview * 10) / 10;
    const updatedStats = await SoftwareStats.findOneAndUpdate(
      { softwareId: software._id },
      { $set: { review: roundedReview }, $setOnInsert: { downloads: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: "Review submitted",
      softwareId: software._id,
      review: updatedStats.review,
    });
  } catch (error) {
    console.error("Error submitting review:", error.message);
    return res.status(500).json({ error: "Failed to submit review" });
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

    const updatedStats = await SoftwareStats.findOneAndUpdate(
      { softwareId: software._id },
      { $inc: { downloads: 1 }, $setOnInsert: { review: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

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
      downloads: updatedStats.downloads,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error generating download link:", error.message);
    return res.status(500).json({ error: "Failed to process download request" });
  }
};

app.get("/software/:id/download", downloadSoftware);

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
