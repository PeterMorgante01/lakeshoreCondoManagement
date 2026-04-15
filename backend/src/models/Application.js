const mongoose = require("mongoose");
const { APPLICATION_STATUS } = require("../utils/constants");
const identitySnapshotSchema = require("./schemas/identitySnapshot");

const applicationSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    tenantIdentity: { type: identitySnapshotSchema, required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    monthlyIncome: { type: Number, required: true, min: 0 },
    message: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.SUBMITTED
    }
  },
  { timestamps: true }
);

applicationSchema.index({ tenant: 1, createdAt: -1 });
applicationSchema.index({ "tenantIdentity.subject": 1, "tenantIdentity.authSource": 1, createdAt: -1 });
applicationSchema.index({ property: 1, status: 1 });

module.exports = mongoose.model("Application", applicationSchema);
