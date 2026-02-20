const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    lease: { type: mongoose.Schema.Types.ObjectId, ref: "Lease", required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: Date.now },
    method: { type: String, default: "CARD" } // placeholder
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);