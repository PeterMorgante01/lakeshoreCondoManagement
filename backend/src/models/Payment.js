const mongoose = require("mongoose");
const { PAYMENT_METHODS } = require("../utils/constants");

const paymentSchema = new mongoose.Schema(
  {
    lease: { type: mongoose.Schema.Types.ObjectId, ref: "Lease", required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CARD
    }
  },
  { timestamps: true }
);

paymentSchema.index({ lease: 1, paidAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);