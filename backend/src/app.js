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

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Property Rental Management API (Phase 1)",
    status: "running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/leases", leasesRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/payments", paymentsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;