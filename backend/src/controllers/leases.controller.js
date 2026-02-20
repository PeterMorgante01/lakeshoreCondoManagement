const { ok, created } = require("../utils/response");

exports.createLease = (req, res) => {
  created(res, { note: "Create lease placeholder (Phase 1)" });
};

exports.getLeases = (req, res) => {
  ok(res, { note: "List leases placeholder (Phase 1)" });
};