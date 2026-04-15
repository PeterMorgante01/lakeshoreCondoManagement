const mongoose = require("mongoose");

const Application = require("../models/Application");
const Lease = require("../models/Lease");
const Property = require("../models/Property");
const User = require("../models/User");
const { APPLICATION_STATUS, ROLES } = require("../utils/constants");
const { ok, created } = require("../utils/response");
const {
  buildIdentityQuery,
  buildIdentitySnapshot,
  presentIdentity
} = require("../utils/authIdentity");

function buildExternalTenantIdentity(input) {
  const tenantIdentity = input?.tenantIdentity || (typeof input?.tenant === "object" ? input.tenant : null);
  if (!tenantIdentity) {
    return null;
  }

  const { subject, email, fullName, authSource, source, role } = tenantIdentity;
  if (!subject || !email || !fullName || !(authSource || source)) {
    throw new Error(
      "tenantIdentity.subject, tenantIdentity.email, tenantIdentity.fullName, and tenantIdentity.authSource are required"
    );
  }

  if (role && role !== ROLES.TENANT) {
    throw new Error("Leases can only be created for TENANT identities");
  }

  return {
    tenantUserId: null,
    tenantIdentity: {
      subject: String(subject),
      authSource: authSource || source,
      email: String(email).toLowerCase(),
      fullName: String(fullName),
      role: ROLES.TENANT
    }
  };
}

async function buildLocalTenantIdentity(input) {
  const tenantId =
    typeof input?.tenant === "string" && mongoose.isValidObjectId(input.tenant)
      ? input.tenant
      : input?.tenantUserId;

  if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
    return null;
  }

  const tenantUser = await User.findById(tenantId).select("fullName email role");
  if (!tenantUser || tenantUser.role !== ROLES.TENANT) {
    throw new Error("Tenant must be an existing JWT-mode user with TENANT role");
  }

  return {
    tenantUserId: tenantUser._id,
    tenantIdentity: buildIdentitySnapshot(tenantUser)
  };
}

async function resolveTenantForLease(input) {
  if (input.applicationId) {
    if (!mongoose.isValidObjectId(input.applicationId)) {
      throw new Error("Valid applicationId is required");
    }

    const application = await Application.findById(input.applicationId)
      .populate("tenant", "fullName email role")
      .lean();

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.status !== APPLICATION_STATUS.APPROVED) {
      throw new Error("Lease can only be created from an APPROVED application");
    }

    return {
      propertyId: application.property,
      tenantUserId: application.tenant || null,
      tenantIdentity: presentIdentity(application.tenantIdentity, application.tenant)
    };
  }

  const localTenant = await buildLocalTenantIdentity(input);
  if (localTenant) {
    return localTenant;
  }

  const externalTenant = buildExternalTenantIdentity(input);
  if (externalTenant) {
    return externalTenant;
  }

  throw new Error(
    "Provide an approved applicationId, a JWT tenant user id, or a tenantIdentity object"
  );
}

exports.createLease = async (req, res, next) => {
  try {
    const { applicationId, property, startDate, endDate, rentAmount } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "startDate and endDate must be valid dates" });
    }

    if (end <= start) {
      return res.status(400).json({ error: "endDate must be after startDate" });
    }

    const resolvedTenant = await resolveTenantForLease(req.body);
    const resolvedPropertyId = resolvedTenant.propertyId || property;

    if (!mongoose.isValidObjectId(resolvedPropertyId)) {
      return res.status(400).json({ error: "Valid property id is required" });
    }

    if (
      applicationId &&
      property &&
      String(property) !== String(resolvedTenant.propertyId)
    ) {
      return res.status(400).json({
        error: "property does not match the property linked to the approved application"
      });
    }

    const propertyDoc = await Property.findById(resolvedPropertyId);
    if (!propertyDoc) {
      return res.status(404).json({ error: "Property not found" });
    }

    const overlappingLease = await Lease.findOne({
      property: resolvedPropertyId,
      isActive: true,
      startDate: { $lt: end },
      endDate: { $gt: start }
    });

    if (overlappingLease) {
      return res.status(409).json({
        error: "Property already has an overlapping active lease for the requested dates"
      });
    }

    const lease = await Lease.create({
      tenant: resolvedTenant.tenantUserId || null,
      tenantIdentity: resolvedTenant.tenantIdentity,
      property: resolvedPropertyId,
      startDate: start,
      endDate: end,
      rentAmount: rentAmount !== undefined ? rentAmount : propertyDoc.rentAmount
    });

    return created(res, { lease }, "Lease created");
  } catch (err) {
    if (
      err.message === "Application not found" ||
      err.message === "Property not found"
    ) {
      return res.status(404).json({ error: err.message });
    }

    if (
      err.message.startsWith("Valid applicationId") ||
      err.message.startsWith("Provide ") ||
      err.message.includes("required") ||
      err.message.includes("TENANT role") ||
      err.message.includes("APPROVED")
    ) {
      return res.status(400).json({ error: err.message });
    }

    return next(err);
  }
};

exports.getLeases = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === ROLES.TENANT) {
      query = buildIdentityQuery("tenantIdentity", req.user, "tenant");
    }

    const leases = await Lease.find(query)
      .populate("tenant", "fullName email role")
      .populate("property", "title address city rentAmount")
      .lean()
      .sort({ createdAt: -1 });

    const normalizedLeases = leases.map((lease) => ({
      ...lease,
      tenant: presentIdentity(lease.tenantIdentity, lease.tenant)
    }));

    return ok(res, { count: normalizedLeases.length, leases: normalizedLeases });
  } catch (err) {
    return next(err);
  }
};
