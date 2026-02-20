const { ok, created } = require("../utils/response");

exports.createApplication = (req, res) => {
  created(res, { note: "Create application placeholder (Phase 1)" });
};

exports.getApplications = (req, res) => {
  ok(res, { note: "List applications placeholder (Phase 1)" });
};

exports.updateApplicationStatus = (req, res) => {
  ok(res, { id: req.params.id, note: "Update application status placeholder" });
};