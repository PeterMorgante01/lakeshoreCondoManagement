const mongoose = require("mongoose");
const { MAINTENANCE_STATUS } = require("../utils/constants");
const identitySnapshotSchema = require("./schemas/identitySnapshot");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    tenantIdentity: { type: identitySnapshotSchema, required: true },
    lease: { type: mongoose.Schema.Types.ObjectId, ref: "Lease", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.OPEN
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedToIdentity: { type: identitySnapshotSchema, default: null }
  },
  { timestamps: true }
);

maintenanceRequestSchema.index({ tenant: 1, createdAt: -1 });
maintenanceRequestSchema.index({ "tenantIdentity.subject": 1, "tenantIdentity.authSource": 1, createdAt: -1 });
maintenanceRequestSchema.index({ status: 1, assignedTo: 1 });
maintenanceRequestSchema.index({
  status: 1,
  "assignedToIdentity.subject": 1,
  "assignedToIdentity.authSource": 1
});

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
