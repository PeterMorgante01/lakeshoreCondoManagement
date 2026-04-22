const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const propertiesRoutes = require("./routes/properties.routes");
const applicationsRoutes = require("./routes/applications.routes");
const leasesRoutes = require("./routes/leases.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const paymentsRoutes = require("./routes/payments.routes");
const keycloakRoutes = require("./routes/keycloak.routes");
const { getAuthMode, isKeycloakEnabled, getSessionMiddleware } = require("./config/keycloak");

const app = express();

const SERVICE_ROLES = {
  MONOLITH: "monolith",
  AUTH: "auth",
  CORE: "core"
};

function normalizeServiceRole(value) {
  const normalized = String(value || SERVICE_ROLES.MONOLITH)
    .trim()
    .toLowerCase();

  if (normalized === SERVICE_ROLES.AUTH || normalized === SERVICE_ROLES.CORE) {
    return normalized;
  }

  return SERVICE_ROLES.MONOLITH;
}

const serviceRole = normalizeServiceRole(process.env.SERVICE_ROLE);
const authRoutesEnabled =
  serviceRole === SERVICE_ROLES.MONOLITH || serviceRole === SERVICE_ROLES.AUTH;
const coreRoutesEnabled =
  serviceRole === SERVICE_ROLES.MONOLITH || serviceRole === SERVICE_ROLES.CORE;

// Add session middleware if Keycloak is enabled
if (isKeycloakEnabled()) {
  app.use(getSessionMiddleware());
}

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    serviceRole,
    authMode: getAuthMode()
  });
});

app.get("/", (req, res) => {
  const endpoints = {};

  if (authRoutesEnabled) {
    endpoints.auth = "/api/auth";
    endpoints.keycloak = isKeycloakEnabled() ? "/api/keycloak" : "disabled";
  }

  if (coreRoutesEnabled) {
    endpoints.properties = "/api/properties";
    endpoints.applications = "/api/applications";
    endpoints.leases = "/api/leases";
    endpoints.maintenance = "/api/maintenance";
    endpoints.payments = "/api/payments";
  }

  res.json({
    message: "Property Rental Management API (Phase 3)",
    status: "running",
    serviceRole,
    authMode: getAuthMode(),
    authentication: isKeycloakEnabled() ? "Keycloak (delegated)" : "JWT (embedded)",
    endpoints
  });
});

if (authRoutesEnabled) {
  app.use("/api/auth", authRoutes);
  app.use("/api/keycloak", keycloakRoutes);
}

if (coreRoutesEnabled) {
  app.use("/api/properties", propertiesRoutes);
  app.use("/api/applications", applicationsRoutes);
  app.use("/api/leases", leasesRoutes);
  app.use("/api/maintenance", maintenanceRoutes);
  app.use("/api/payments", paymentsRoutes);
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
