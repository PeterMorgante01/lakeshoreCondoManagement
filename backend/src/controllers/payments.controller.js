const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Lease = require("../models/Lease");
const { ROLES } = require("../utils/constants");
const { ok, created } = require("../utils/response");
const { buildIdentityQuery, presentIdentity } = require("../utils/authIdentity");

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
      const tenantLeases = await Lease.find(
        buildIdentityQuery("tenantIdentity", req.user, "tenant")
      ).select("_id");
      leaseFilter.lease = { $in: tenantLeases.map((lease) => lease._id) };
    }

    const payments = await Payment.find(leaseFilter)
      .populate({
        path: "lease",
        populate: [
          { path: "tenant", select: "fullName email role" },
          { path: "property", select: "title address city" }
        ]
      })
      .lean()
      .sort({ paidAt: -1 });

    const normalizedPayments = payments.map((payment) => ({
      ...payment,
      lease: payment.lease
        ? {
            ...payment.lease,
            tenant: presentIdentity(payment.lease.tenantIdentity, payment.lease.tenant)
          }
        : null
    }));

    return ok(res, { count: normalizedPayments.length, payments: normalizedPayments });
  } catch (err) {
    return next(err);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid payment id" });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    await payment.deleteOne();

    return ok(res, { paymentId: req.params.id }, "Payment deleted");
  } catch (err) {
    return next(err);
  }
};
