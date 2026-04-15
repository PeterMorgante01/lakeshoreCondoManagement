const mongoose = require("mongoose");
const identitySnapshotSchema = require("./schemas/identitySnapshot");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    rentAmount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdByIdentity: { type: identitySnapshotSchema, default: null }
  },
  { timestamps: true }
);

propertySchema.index({ city: 1, isActive: 1 });
propertySchema.index({ createdBy: 1, createdAt: -1 });
propertySchema.index({ "createdByIdentity.subject": 1, "createdByIdentity.authSource": 1 });

module.exports = mongoose.model("Property", propertySchema);
