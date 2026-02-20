const { ok, created } = require("../utils/response");

exports.register = (req, res) => {
  created(res, { note: "Register endpoint placeholder (Phase 1)" }, "Registered (placeholder)");
};

exports.login = (req, res) => {
  ok(res, { note: "Login endpoint placeholder (Phase 1)" }, "Logged in (placeholder)");
};

exports.me = (req, res) => {
  ok(res, { note: "/me placeholder (Phase 1)" });
};