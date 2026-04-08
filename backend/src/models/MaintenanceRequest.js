const mongoose = require("mongoose");
const { MAINTENANCE_STATUS } = require("../utils/constants");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lease: { type: mongoose.Schema.Types.ObjectId, ref: "Lease", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.OPEN
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

maintenanceRequestSchema.index({ tenant: 1, createdAt: -1 });
maintenanceRequestSchema.index({ status: 1, assignedTo: 1 });

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);