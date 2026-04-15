const mongoose = require("mongoose");

const Lease = require("../models/Lease");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const User = require("../models/User");
const { MAINTENANCE_STATUS, ROLES } = require("../utils/constants");
const { ok, created } = require("../utils/response");
const {
  buildIdentityQuery,
  buildIdentitySnapshot,
  getAuthSource,
  getLegacyUserId,
  getUserSubject,
  matchesIdentity,
  presentIdentity
} = require("../utils/authIdentity");

async function resolveAssignmentInput(body) {
  const hasAssignmentField =
    Object.prototype.hasOwnProperty.call(body, "assignedTo") ||
    Object.prototype.hasOwnProperty.call(body, "assignedToUserId") ||
    Object.prototype.hasOwnProperty.call(body, "assignedToIdentity");

  if (!hasAssignmentField) {
    return null;
  }

  if (body.assignedTo === null || body.assignedToIdentity === null) {
    return { assignedTo: null, assignedToIdentity: null };
  }

  const assigneeIdentity =
    body.assignedToIdentity || (typeof body.assignedTo === "object" ? body.assignedTo : null);

  if (assigneeIdentity) {
    const { subject, email, fullName, authSource, source, role } = assigneeIdentity;

    if (!subject || !email || !fullName || !(authSource || source)) {
      throw new Error(
        "assignedToIdentity.subject, assignedToIdentity.email, assignedToIdentity.fullName, and assignedToIdentity.authSource are required"
      );
    }

    if (role && role !== ROLES.MAINTENANCE) {
      throw new Error("Assigned user must have MAINTENANCE role");
    }

    return {
      assignedTo: null,
      assignedToIdentity: {
        subject: String(subject),
        authSource: authSource || source,
        email: String(email).toLowerCase(),
        fullName: String(fullName),
        role: ROLES.MAINTENANCE
      }
    };
  }

  const assigneeId =
    typeof body.assignedTo === "string" ? body.assignedTo : body.assignedToUserId;

  if (!assigneeId || !mongoose.isValidObjectId(assigneeId)) {
    throw new Error("assignedTo must be null, a valid user id, or an assignedToIdentity object");
  }

  const assignee = await User.findById(assigneeId).select("fullName email role");
  if (!assignee || assignee.role !== ROLES.MAINTENANCE) {
    throw new Error("Assigned user must be an existing MAINTENANCE user");
  }

  return {
    assignedTo: assignee._id,
    assignedToIdentity: buildIdentitySnapshot(assignee)
  };
}

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

    if (!matchesIdentity(leaseDoc.tenantIdentity, req.user, leaseDoc.tenant)) {
      return res.status(403).json({ error: "You can only create requests for your own lease" });
    }

    const maintenance = await MaintenanceRequest.create({
      tenant: getLegacyUserId(req.user),
      tenantIdentity: buildIdentitySnapshot(req.user),
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
    let query = {};

    if (req.user.role === ROLES.TENANT) {
      query = buildIdentityQuery("tenantIdentity", req.user, "tenant");
    }

    if (req.user.role === ROLES.MAINTENANCE) {
      const assignedClauses = [
        {
          "assignedToIdentity.subject": getUserSubject(req.user),
          "assignedToIdentity.authSource": getAuthSource(req.user)
        },
        { assignedTo: null, assignedToIdentity: null }
      ];

      const legacyUserId = getLegacyUserId(req.user);
      if (legacyUserId) {
        assignedClauses.unshift({ assignedTo: legacyUserId });
      }

      query = { $or: assignedClauses };
    }

    const maintenance = await MaintenanceRequest.find(query)
      .populate("tenant", "fullName email role")
      .populate({
        path: "lease",
        populate: { path: "property", select: "title address city rentAmount" }
      })
      .populate("assignedTo", "fullName email role")
      .lean()
      .sort({ createdAt: -1 });

    const normalizedMaintenance = maintenance.map((entry) => ({
      ...entry,
      tenant: presentIdentity(entry.tenantIdentity, entry.tenant),
      assignedTo: presentIdentity(entry.assignedToIdentity, entry.assignedTo)
    }));

    return ok(res, {
      count: normalizedMaintenance.length,
      maintenance: normalizedMaintenance
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateMaintenanceStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid maintenance request id" });
    }

    const { status } = req.body;
    if (status && !Object.values(MAINTENANCE_STATUS).includes(status)) {
      return res.status(400).json({ error: "Invalid maintenance status" });
    }

    const maintenance = await MaintenanceRequest.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    if (
      req.user.role === ROLES.MAINTENANCE &&
      (maintenance.assignedToIdentity || maintenance.assignedTo) &&
      !matchesIdentity(maintenance.assignedToIdentity, req.user, maintenance.assignedTo)
    ) {
      return res.status(403).json({
        error: "Maintenance staff can only update tasks assigned to them or unassigned tasks"
      });
    }

    let assignment = null;
    try {
      assignment = await resolveAssignmentInput(req.body);
    } catch (assignmentErr) {
      return res.status(400).json({ error: assignmentErr.message });
    }

    if (
      req.user.role === ROLES.MAINTENANCE &&
      assignment &&
      assignment.assignedToIdentity &&
      !matchesIdentity(assignment.assignedToIdentity, req.user, assignment.assignedTo)
    ) {
      return res.status(403).json({
        error: "Maintenance staff can only assign requests to themselves"
      });
    }

    const update = {};
    if (status) update.status = status;
    if (assignment) {
      update.assignedTo = assignment.assignedTo;
      update.assignedToIdentity = assignment.assignedToIdentity;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({
        error: "Provide at least one valid update field"
      });
    }

    const updatedMaintenance = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    return ok(res, { maintenance: updatedMaintenance }, "Maintenance request updated");
  } catch (err) {
    return next(err);
  }
};
