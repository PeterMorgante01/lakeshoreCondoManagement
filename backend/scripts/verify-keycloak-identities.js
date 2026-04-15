require("dotenv").config();

const connectDB = require("../src/config/db");
const Application = require("../src/models/Application");
const Lease = require("../src/models/Lease");
const MaintenanceRequest = require("../src/models/MaintenanceRequest");
const Property = require("../src/models/Property");
const User = require("../src/models/User");
const { buildIdentityQuery } = require("../src/utils/authIdentity");

(async () => {
  const connection = await connectDB();
  const stamp = Date.now();

  const managerIdentity = {
    subject: `kc-manager-${stamp}`,
    authSource: "keycloak",
    email: `kc.manager.${stamp}@example.com`,
    fullName: "KC Manager",
    role: "MANAGER"
  };

  const tenantIdentity = {
    subject: `kc-tenant-${stamp}`,
    authSource: "keycloak",
    email: `kc.tenant.${stamp}@example.com`,
    fullName: "KC Tenant",
    role: "TENANT"
  };

  const maintenanceIdentity = {
    subject: `kc-maint-${stamp}`,
    authSource: "keycloak",
    email: `kc.maint.${stamp}@example.com`,
    fullName: "KC Maintenance",
    role: "MAINTENANCE"
  };

  let property;
  let application;
  let lease;
  let maintenance;

  try {
    property = await Property.create({
      title: `Keycloak Unit ${stamp}`,
      address: "200 Identity Blvd",
      city: "Toronto",
      rentAmount: 2100,
      createdByIdentity: managerIdentity
    });

    application = await Application.create({
      tenantIdentity,
      property: property._id,
      monthlyIncome: 5200,
      status: "APPROVED"
    });

    lease = await Lease.create({
      tenantIdentity,
      property: property._id,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-05-31"),
      rentAmount: 2100
    });

    maintenance = await MaintenanceRequest.create({
      tenantIdentity,
      lease: lease._id,
      title: "Keycloak repair",
      description: "External user workflow",
      assignedToIdentity: maintenanceIdentity
    });

    const applicationCount = await Application.countDocuments(
      buildIdentityQuery(
        "tenantIdentity",
        {
          subject: tenantIdentity.subject,
          authSource: tenantIdentity.authSource,
          email: tenantIdentity.email,
          fullName: tenantIdentity.fullName,
          role: tenantIdentity.role,
          isKeycloakUser: true
        },
        "tenant"
      )
    );

    const provisionedUser = await User.findOne({ email: tenantIdentity.email });

    console.log(
      JSON.stringify(
        {
          mode: "keycloak-data-path",
          checks: {
            applicationStored: !!application._id,
            leaseStored: !!lease._id,
            maintenanceStored: !!maintenance._id,
            applicationQueryableByIdentity: applicationCount === 1,
            keycloakUserProvisionedToDb: !!provisionedUser
          }
        },
        null,
        2
      )
    );
  } finally {
    if (maintenance?._id) {
      await MaintenanceRequest.findByIdAndDelete(maintenance._id);
    }
    if (lease?._id) {
      await Lease.findByIdAndDelete(lease._id);
    }
    if (application?._id) {
      await Application.findByIdAndDelete(application._id);
    }
    if (property?._id) {
      await Property.findByIdAndDelete(property._id);
    }

    await connection.disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
