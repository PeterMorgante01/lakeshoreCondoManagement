const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { ROLES } = require("../utils/constants");
const { ok, created } = require("../utils/response");
const { toRequestUser } = require("../utils/authIdentity");

function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "fullName, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const normalizedRole = role || ROLES.TENANT;
    if (!Object.values(ROLES).includes(normalizedRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (normalizedRole !== ROLES.TENANT) {
      return res.status(403).json({
        error: "Self-registration is limited to TENANT accounts"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: normalizedRole
    });

    const token = signToken(user._id.toString(), user.role);

    return created(
      res,
      {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      },
      "Registered"
    );
  } catch (err) {
    return next(err);
  }
};

exports.createManagedUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        error: "fullName, email, password, and role are required"
      });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role
    });

    return created(
      res,
      {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      },
      "User created"
    );
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user._id.toString(), user.role);

    return ok(
      res,
      {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      },
      "Logged in"
    );
  } catch (err) {
    return next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    return ok(res, { user: toRequestUser(req.user) });
  } catch (err) {
    return next(err);
  }
};
