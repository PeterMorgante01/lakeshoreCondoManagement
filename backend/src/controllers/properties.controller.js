const mongoose = require("mongoose");

const Property = require("../models/Property");
const { ok, created } = require("../utils/response");

exports.createProperty = async (req, res, next) => {
  try {
    const { title, address, city, rentAmount, isActive } = req.body;

    if (!title || !address || !city || rentAmount === undefined) {
      return res.status(400).json({ error: "title, address, city, and rentAmount are required" });
    }

    const property = await Property.create({
      title,
      address,
      city,
      rentAmount,
      isActive,
      createdBy: req.user._id
    });

    return created(res, { property }, "Property created");
  } catch (err) {
    return next(err);
  }
};

exports.getAllProperties = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === "true";
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 });
    return ok(res, { count: properties.length, properties });
  } catch (err) {
    return next(err);
  }
};

exports.getPropertyById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid property id" });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return ok(res, { property });
  } catch (err) {
    return next(err);
  }
};

exports.updateProperty = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid property id" });
    }

    const allowedUpdates = ["title", "address", "city", "rentAmount", "isActive"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
    );

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const property = await Property.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return ok(res, { property }, "Property updated");
  } catch (err) {
    return next(err);
  }
};