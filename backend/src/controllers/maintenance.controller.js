const { ok, created } = require("../utils/response");

exports.createMaintenance = (req, res) => {
  created(res, { note: "Create maintenance request placeholder (Phase 1)" });
};

exports.getMaintenance = (req, res) => {
  ok(res, { note: "List maintenance requests placeholder (Phase 1)" });
};

exports.updateMaintenanceStatus = (req, res) => {
  ok(res, { id: req.params.id, note: "Update maintenance status placeholder" });
};