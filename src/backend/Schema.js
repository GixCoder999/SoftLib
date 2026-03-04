const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SoftwareSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  platforms: { type: [String], default: [] },
  description: { type: String, required: true },
  version: { type: String, required: true },
  license: { type: String, required: true },
  repositoryUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
  reviewed: { type: Boolean, default: true },
});

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SoftwareStatsSchema = new Schema({
  softwareId: {
    type: Schema.Types.ObjectId,
    ref: "Software",
    required: true,
    unique: true,
  },
  review: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    set: (value) => Math.round(value * 10) / 10,
    validate: {
      validator: (value) => Number.isInteger(value * 10),
      message: "Review must have only 1 decimal place",
    },
  },
  downloads: { type: Number, required: true, default: 0, min: 0 },
});


const Software =
  mongoose.models.Software || 
  mongoose.model("Software", SoftwareSchema);

const User = 
    mongoose.models.User || 
    mongoose.model("User", UserSchema);

const SoftwareStats =
  mongoose.models.SoftwareStats ||
  mongoose.model("SoftwareStats", SoftwareStatsSchema);


module.exports = { Software, User, SoftwareStats };
