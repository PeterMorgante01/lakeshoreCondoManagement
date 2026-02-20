const { ok, created } = require("../utils/response");

exports.createProperty = (req, res) => {
  created(res, { note: "Create property placeholder (Phase 1)" });
};

exports.getAllProperties = (req, res) => {
  ok(res, { note: "List properties placeholder (Phase 1)" });
};

exports.getPropertyById = (req, res) => {
  ok(res, { id: req.params.id, note: "Get property by id placeholder" });
};

exports.updateProperty = (req, res) => {
  ok(res, { id: req.params.id, note: "Update property placeholder" }, "Updated (placeholder)");
};