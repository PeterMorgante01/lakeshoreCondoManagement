const mongoose = require("mongoose");

const Lease = require("../models/Lease");
const User = require("../models/User");
const Property = require("../models/Property");
const { ROLES } = require("../utils/constants");
const { ok, created } = require("../utils/response");

exports.createLease = async (req, res, next) => {
  try {
    const { tenant, property, startDate, endDate, rentAmount } = req.body;

    if (!mongoose.isValidObjectId(tenant) || !mongoose.isValidObjectId(property)) {
      return res.status(400).json({ error: "Valid tenant and property ids are required" });
    }

    const tenantUser = await User.findById(tenant);
    if (!tenantUser || tenantUser.role !== ROLES.TENANT) {
      return res.status(400).json({ error: "Tenant must be an existing user with TENANT role" });
    }

    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: "endDate must be after startDate" });
    }

    const lease = await Lease.create({
      tenant,
      property,
      startDate,
      endDate,
      rentAmount: rentAmount !== undefined ? rentAmount : propertyDoc.rentAmount
    });

    return created(res, { lease }, "Lease created");
  } catch (err) {
    return next(err);
  }
};

exports.getLeases = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === ROLES.TENANT) {
      query.tenant = req.user._id;
    }

    const leases = await Lease.find(query)
      .populate("tenant", "fullName email")
      .populate("property", "title address city rentAmount")
      .sort({ createdAt: -1 });

    return ok(res, { count: leases.length, leases });
  } catch (err) {
    return next(err);
  }
};