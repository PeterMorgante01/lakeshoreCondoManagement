const session = require("express-session");

const { AUTH_MODES } = require("../utils/constants");

function normalizeMode(mode) {
  return String(mode || AUTH_MODES.JWT).trim().toLowerCase();
}

function getAuthMode() {
  return normalizeMode(process.env.AUTH_MODE) === AUTH_MODES.KEYCLOAK
    ? AUTH_MODES.KEYCLOAK
    : AUTH_MODES.JWT;
}

function hasKeycloakConfig() {
  return !!(
    process.env.KEYCLOAK_AUTH_SERVER_URL &&
    process.env.KEYCLOAK_REALM &&
    process.env.KEYCLOAK_CLIENT_ID
  );
}

const keycloakConfig = {
  authServerUrl: String(process.env.KEYCLOAK_AUTH_SERVER_URL || "").replace(/\/+$/, ""),
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  bearerOnly: process.env.KEYCLOAK_BEARER_ONLY !== "false",
  publicClient: process.env.KEYCLOAK_PUBLIC_CLIENT === "true"
};

const sessionConfig = {
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "session-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
};

function isKeycloakEnabled() {
  return getAuthMode() === AUTH_MODES.KEYCLOAK;
}

function validateAuthConfiguration() {
  if (getAuthMode() === AUTH_MODES.JWT) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required when AUTH_MODE=jwt");
    }

    return;
  }

  const missing = [];
  if (!process.env.KEYCLOAK_AUTH_SERVER_URL) missing.push("KEYCLOAK_AUTH_SERVER_URL");
  if (!process.env.KEYCLOAK_REALM) missing.push("KEYCLOAK_REALM");
  if (!process.env.KEYCLOAK_CLIENT_ID) missing.push("KEYCLOAK_CLIENT_ID");
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET");

  if (missing.length) {
    throw new Error(
      `Missing required Keycloak configuration: ${missing.join(", ")}`
    );
  }
}

function getSessionMiddleware() {
  return session(sessionConfig);
}

module.exports = {
  keycloakConfig,
  sessionConfig,
  getAuthMode,
  hasKeycloakConfig,
  isKeycloakEnabled,
  getSessionMiddleware,
  validateAuthConfiguration
};
