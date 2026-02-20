const mongoose = require("mongoose");
const { ROLES } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }, 
    role: { type: String, enum: Object.values(ROLES), default: ROLES.TENANT }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);