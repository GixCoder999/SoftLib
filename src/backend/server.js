const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const ConnectDB = require("./db.js");
const { Software, SoftwareStats, User } = require("./Schema.js");
const {
  registerUser,
  loginUser,
  authMiddleware,
  verifyAuthFromRequest,
  adminMiddleware,
  ensureAdminUser,
  isAdminIdentity,
} = require("./auth.js");

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

app.get("/auth/status", authMiddleware, (req, res) => {
  return res.json({ success: true, authenticated: true });
});

app.get("/auth/admin-status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("username email").lean();
    return res.json({
      success: true,
      isAdmin: isAdminIdentity(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, isAdmin: false });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ success: true, message: "Logged out successfully" });
});

async function startServer() {
  try {
    await ConnectDB();
    await ensureAdminUser();
    await Software.updateMany({ reviewed: { $exists: false } }, { $set: { reviewed: true } });
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
    const softwareList = await Software.find({ reviewed: true }).lean();
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

app.post("/software/submit", authMiddleware, async (req, res) => {
  try {
    const { name, category, platforms, description, version, license, repositoryUrl } = req.body || {};

    const normalizedName = String(name || "").trim();
    const normalizedCategory = String(category || "").trim();
    const normalizedDescription = String(description || "").trim();
    const normalizedVersion = String(version || "").trim();
    const normalizedLicense = String(license || "").trim();
    const normalizedRepositoryUrl = String(repositoryUrl || "").trim();
    const normalizedPlatforms = Array.isArray(platforms)
      ? platforms.map((platform) => String(platform || "").trim()).filter(Boolean)
      : [];

    if (
      !normalizedName ||
      !normalizedCategory ||
      !normalizedDescription ||
      !normalizedVersion ||
      !normalizedLicense ||
      !normalizedRepositoryUrl
    ) {
      return res.status(400).json({
        error:
          "name, category, platforms, description, version, license and repositoryUrl are required",
      });
    }

    if (normalizedPlatforms.length === 0) {
      return res.status(400).json({
        error: "At least one platform is required",
      });
    }

    if (!getDropboxDirectDownloadUrl(normalizedRepositoryUrl)) {
      return res.status(400).json({
        error: "Only Dropbox links are supported for repositoryUrl",
      });
    }

    const software = await Software.create({
      name: normalizedName,
      category: normalizedCategory,
      platforms: [...new Set(normalizedPlatforms)],
      description: normalizedDescription,
      version: normalizedVersion,
      license: normalizedLicense,
      repositoryUrl: normalizedRepositoryUrl,
      isPremium: false,
      reviewed: false,
    });

    return res.status(201).json({
      message: "Software submitted successfully",
      software,
    });
  } catch (error) {
    console.error("Error submitting software:", error.message);
    return res.status(500).json({ error: "Failed to submit software" });
  }
});

app.get("/admin/software/review-queue", adminMiddleware, async (req, res) => {
  try {
    const pendingSoftware = await Software.find({ reviewed: false })
      .sort({ createdAt: -1 })
      .lean();

    res.json(pendingSoftware);
  } catch (error) {
    console.error("Error fetching review queue:", error.message);
    res.status(500).json({ error: "Failed to fetch review queue" });
  }
});

app.post("/admin/software/:id/approve", adminMiddleware, async (req, res) => {
  try {
    const softwareId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(softwareId)) {
      return res.status(400).json({ error: "Invalid software id" });
    }

    const approvedSoftware = await Software.findByIdAndUpdate(
      softwareId,
      { $set: { reviewed: true } },
      { new: true }
    ).lean();

    if (!approvedSoftware) {
      return res.status(404).json({ error: "Software not found" });
    }

    return res.json({
      success: true,
      message: "Software approved",
      softwareId: approvedSoftware._id,
    });
  } catch (error) {
    console.error("Error approving software:", error.message);
    return res.status(500).json({ error: "Failed to approve software" });
  }
});

app.delete("/admin/software/:id/reject", adminMiddleware, async (req, res) => {
  try {
    const softwareId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(softwareId)) {
      return res.status(400).json({ error: "Invalid software id" });
    }

    const deletedSoftware = await Software.findByIdAndDelete(softwareId).lean();
    if (!deletedSoftware) {
      return res.status(404).json({ error: "Software not found" });
    }

    await SoftwareStats.deleteOne({ softwareId: deletedSoftware._id });
    return res.json({
      success: true,
      message: "Software rejected and deleted",
      softwareId: deletedSoftware._id,
    });
  } catch (error) {
    console.error("Error rejecting software:", error.message);
    return res.status(500).json({ error: "Failed to reject software" });
  }
});

app.get('/software/:id',async (req,res)=>{
  try {
    const softwareId = req.params.id;
    console.log('Fetching software with ID:', softwareId);
    if (!mongoose.Types.ObjectId.isValid(softwareId)) {
      return res.status(400).json({ error: "Invalid software id" });
    }
    const soft = await Software.findOne({ _id: softwareId, reviewed: true }).lean();
    
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

    const software = await Software.findOne({ _id: softwareId, reviewed: true }).select("_id");
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

    const software = await Software.findOne({ _id: softwareId, reviewed: true })
      .select("name repositoryUrl isPremium");
    if (!software) {
      return res.status(404).json({ error: "Software not found" });
    }

    if (software.isPremium) {
      const authResult = verifyAuthFromRequest(req);
      if (!authResult.authenticated) {
        return res.status(401).json({
          error: "Please sign in to download premium software",
        });
      }
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
