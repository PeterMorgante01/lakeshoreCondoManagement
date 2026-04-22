const mongoose = require("mongoose");

const Application = require("../models/Application");
const Property = require("../models/Property");
const { ROLES, APPLICATION_STATUS } = require("../utils/constants");
const { ok, created } = require("../utils/response");
const {
  buildIdentityQuery,
  buildIdentitySnapshot,
  getLegacyUserId,
  presentIdentity
} = require("../utils/authIdentity");

exports.createApplication = async (req, res, next) => {
  try {
    const { property, monthlyIncome, message } = req.body;

    if (!mongoose.isValidObjectId(property)) {
      return res.status(400).json({ error: "Valid property id is required" });
    }

    if (monthlyIncome === undefined || Number(monthlyIncome) < 0) {
      return res.status(400).json({ error: "Valid monthlyIncome is required" });
    }

    const propertyExists = await Property.findById(property);
    if (!propertyExists) {
      return res.status(404).json({ error: "Property not found" });
    }

    const application = await Application.create({
      tenant: getLegacyUserId(req.user),
      tenantIdentity: buildIdentitySnapshot(req.user),
      property,
      monthlyIncome,
      message
    });

    return created(res, { application }, "Application created");
  } catch (err) {
    return next(err);
  }
};

exports.getApplications = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === ROLES.TENANT) {
      query = buildIdentityQuery("tenantIdentity", req.user, "tenant");
    }

    const applications = await Application.find(query)
      .populate("tenant", "fullName email role")
      .populate("property", "title address city rentAmount")
      .lean()
      .sort({ createdAt: -1 });

    const normalizedApplications = applications.map((application) => ({
      ...application,
      tenant: presentIdentity(application.tenantIdentity, application.tenant)
    }));

    return ok(res, {
      count: normalizedApplications.length,
      applications: normalizedApplications
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    const { status } = req.body;
    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return res.status(400).json({ error: "Invalid application status" });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    return ok(res, { application }, "Application status updated");
  } catch (err) {
    return next(err);
  }
};

exports.deleteApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    await application.deleteOne();

    return ok(res, { applicationId: req.params.id }, "Application deleted");
  } catch (err) {
    return next(err);
  }
};
