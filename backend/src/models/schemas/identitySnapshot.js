const mongoose = require("mongoose");

const { ROLES, AUTH_SOURCES } = require("../../utils/constants");

const identitySnapshotSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    authSource: {
      type: String,
      enum: Object.values(AUTH_SOURCES),
      required: true
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(ROLES), required: true }
  },
  { _id: false }
);

module.exports = identitySnapshotSchema;
