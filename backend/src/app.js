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

// Add session middleware if Keycloak is enabled
if (isKeycloakEnabled()) {
  app.use(getSessionMiddleware());
}

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Property Rental Management API (Phase 2 + Keycloak)",
    status: "running",
    authMode: getAuthMode(),
    authentication: isKeycloakEnabled() ? "Keycloak (delegated)" : "JWT (embedded)",
    endpoints: {
      auth: "/api/auth",
      keycloak: isKeycloakEnabled() ? "/api/keycloak" : "disabled",
      properties: "/api/properties",
      applications: "/api/applications",
      leases: "/api/leases",
      maintenance: "/api/maintenance",
      payments: "/api/payments"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/keycloak", keycloakRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/leases", leasesRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/payments", paymentsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
