const mongoose = require("mongoose");
const { APPLICATION_STATUS } = require("../utils/constants");

const applicationSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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

module.exports = mongoose.model("Application", applicationSchema);