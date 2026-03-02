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
  isPremium: { type: Boolean, default: false }
});

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});


const Software =
  mongoose.models.Software || 
  mongoose.model("Software", SoftwareSchema);

const User = 
    mongoose.models.User || 
    mongoose.model("User", UserSchema);



module.exports = { Software, User };
