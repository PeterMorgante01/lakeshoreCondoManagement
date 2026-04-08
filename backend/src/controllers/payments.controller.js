const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Lease = require("../models/Lease");
const { ROLES } = require("../utils/constants");
const { ok, created } = require("../utils/response");

exports.createPayment = async (req, res, next) => {
  try {
    const { lease, amount, paidAt, method } = req.body;

    if (!mongoose.isValidObjectId(lease)) {
      return res.status(400).json({ error: "Valid lease id is required" });
    }

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ error: "amount must be greater than 0" });
    }

    const leaseDoc = await Lease.findById(lease);
    if (!leaseDoc) {
      return res.status(404).json({ error: "Lease not found" });
    }

    const payment = await Payment.create({
      lease,
      amount,
      paidAt,
      method
    });

    return created(res, { payment }, "Payment created");
  } catch (err) {
    return next(err);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const leaseFilter = {};

    if (req.user.role === ROLES.TENANT) {
      const tenantLeases = await Lease.find({ tenant: req.user._id }).select("_id");
      leaseFilter.lease = { $in: tenantLeases.map((lease) => lease._id) };
    }

    const payments = await Payment.find(leaseFilter)
      .populate({
        path: "lease",
        populate: [
          { path: "tenant", select: "fullName email" },
          { path: "property", select: "title address city" }
        ]
      })
      .sort({ paidAt: -1 });

    return ok(res, { count: payments.length, payments });
  } catch (err) {
    return next(err);
  }
};