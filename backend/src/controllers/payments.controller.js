const { ok, created } = require("../utils/response");

exports.createPayment = (req, res) => {
  created(res, { note: "Create payment placeholder (Phase 1)" });
};

exports.getPayments = (req, res) => {
  ok(res, { note: "List payments placeholder (Phase 1)" });
};