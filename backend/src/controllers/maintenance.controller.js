const mongoose = require("mongoose");

const MaintenanceRequest = require("../models/MaintenanceRequest");
const Lease = require("../models/Lease");
const { ROLES, MAINTENANCE_STATUS } = require("../utils/constants");
const { ok, created } = require("../utils/response");

exports.createMaintenance = async (req, res, next) => {
  try {
    const { lease, title, description } = req.body;

    if (!mongoose.isValidObjectId(lease)) {
      return res.status(400).json({ error: "Valid lease id is required" });
    }

    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const leaseDoc = await Lease.findById(lease);
    if (!leaseDoc) {
      return res.status(404).json({ error: "Lease not found" });
    }

    if (leaseDoc.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only create requests for your own lease" });
    }

    const maintenance = await MaintenanceRequest.create({
      tenant: req.user._id,
      lease,
      title,
      description
    });

    return created(res, { maintenance }, "Maintenance request created");
  } catch (err) {
    return next(err);
  }
};

exports.getMaintenance = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === ROLES.TENANT) {
      query.tenant = req.user._id;
    }

    if (req.user.role === ROLES.MAINTENANCE) {
      query.$or = [{ assignedTo: req.user._id }, { assignedTo: null }];
    }

    const maintenance = await MaintenanceRequest.find(query)
      .populate("tenant", "fullName email")
      .populate("lease", "property startDate endDate")
      .populate("assignedTo", "fullName email role")
      .sort({ createdAt: -1 });

    return ok(res, { count: maintenance.length, maintenance });
  } catch (err) {
    return next(err);
  }
};

exports.updateMaintenanceStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid maintenance request id" });
    }

    const { status, assignedTo } = req.body;
    if (status && !Object.values(MAINTENANCE_STATUS).includes(status)) {
      return res.status(400).json({ error: "Invalid maintenance status" });
    }

    const update = {};
    if (status) update.status = status;
    if (assignedTo !== undefined) {
      if (assignedTo !== null && !mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({ error: "assignedTo must be null or a valid user id" });
      }
      update.assignedTo = assignedTo;
    }

    const maintenance = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    return ok(res, { maintenance }, "Maintenance request updated");
  } catch (err) {
    return next(err);
  }
};