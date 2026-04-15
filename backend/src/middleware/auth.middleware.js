const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { isKeycloakEnabled } = require("../config/keycloak");
const { keycloakProtect } = require("./keycloak.middleware");
const { toRequestUser } = require("../utils/authIdentity");

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function protect(req, res, next) {
  if (isKeycloakEnabled()) {
    return keycloakProtect(req, res, next);
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("fullName email role");

      if (!user) {
        return res.status(401).json({ error: "Invalid token user" });
      }

      req.user = toRequestUser(user);
      req.authSource = "jwt";
      return next();
    } catch (jwtErr) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Authentication error:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    return next();
  };
}

function requireJwtMode(req, res, next) {
  if (isKeycloakEnabled()) {
    return res.status(503).json({
      error: "This endpoint is unavailable when AUTH_MODE=keycloak"
    });
  }

  return next();
}

module.exports = { protect, authorize, requireJwtMode };
