require("dotenv").config();

const bcrypt = require("bcryptjs");

const app = require("../src/app");
const connectDB = require("../src/config/db");
const Application = require("../src/models/Application");
const Lease = require("../src/models/Lease");
const MaintenanceRequest = require("../src/models/MaintenanceRequest");
const Payment = require("../src/models/Payment");
const Property = require("../src/models/Property");
const User = require("../src/models/User");

async function api(baseUrl, path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const body = await res.json();

  if (!res.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} failed with ${res.status}: ${JSON.stringify(body)}`
    );
  }

  return body;
}

(async () => {
  const connection = await connectDB();
  const stamp = Date.now();
  const ids = {
    userIds: [],
    propertyId: null,
    applicationId: null,
    leaseId: null,
    maintenanceId: null,
    paymentId: null
  };

  const managerEmail = `manager.${stamp}@example.com`;
  const tenantEmail = `tenant.${stamp}@example.com`;
  const maintenanceEmail = `maintenance.${stamp}@example.com`;
  const badManagerEmail = `bad.${stamp}@example.com`;

  let server;

  try {
    const managerPasswordHash = await bcrypt.hash("Manager123!", 12);
    const manager = await User.create({
      fullName: "Smoke Manager",
      email: managerEmail,
      passwordHash: managerPasswordHash,
      role: "MANAGER"
    });
    ids.userIds.push(manager._id);

    server = app.listen(0);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const tenantRegistration = await api(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Smoke Tenant",
        email: tenantEmail,
        password: "Tenant123!"
      })
    });
    ids.userIds.push(tenantRegistration.data.user.id);

    let privilegedRegistrationBlocked = false;
    try {
      await api(baseUrl, "/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Blocked Manager",
          email: badManagerEmail,
          password: "Tenant123!",
          role: "MANAGER"
        })
      });
    } catch (err) {
      privilegedRegistrationBlocked = /403/.test(err.message);
    }

    const managerLogin = await api(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: managerEmail,
        password: "Manager123!"
      })
    });

    const tenantLogin = await api(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: tenantEmail,
        password: "Tenant123!"
      })
    });

    const maintenanceUser = await api(baseUrl, "/api/auth/users", {
      method: "POST",
      headers: { Authorization: `Bearer ${managerLogin.data.token}` },
      body: JSON.stringify({
        fullName: "Smoke Maintenance",
        email: maintenanceEmail,
        password: "Maint123!",
        role: "MAINTENANCE"
      })
    });
    ids.userIds.push(maintenanceUser.data.user.id);

    const property = await api(baseUrl, "/api/properties", {
      method: "POST",
      headers: { Authorization: `Bearer ${managerLogin.data.token}` },
      body: JSON.stringify({
        title: "Smoke Test Unit",
        address: "100 Test Ave",
        city: "Toronto",
        rentAmount: 1800
      })
    });
    ids.propertyId = property.data.property._id;

    const application = await api(baseUrl, "/api/applications", {
      method: "POST",
      headers: { Authorization: `Bearer ${tenantLogin.data.token}` },
      body: JSON.stringify({
        property: ids.propertyId,
        monthlyIncome: 4500,
        message: "Ready to move in"
      })
    });
    ids.applicationId = application.data.application._id;

    await api(baseUrl, `/api/applications/${ids.applicationId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${managerLogin.data.token}` },
      body: JSON.stringify({ status: "APPROVED" })
    });

    const lease = await api(baseUrl, "/api/leases", {
      method: "POST",
      headers: { Authorization: `Bearer ${managerLogin.data.token}` },
      body: JSON.stringify({
        applicationId: ids.applicationId,
        startDate: "2026-05-01",
        endDate: "2027-04-30"
      })
    });
    ids.leaseId = lease.data.lease._id;

    const maintenance = await api(baseUrl, "/api/maintenance", {
      method: "POST",
      headers: { Authorization: `Bearer ${tenantLogin.data.token}` },
      body: JSON.stringify({
        lease: ids.leaseId,
        title: "Leaky faucet",
        description: "Kitchen sink faucet is leaking"
      })
    });
    ids.maintenanceId = maintenance.data.maintenance._id;

    await api(baseUrl, `/api/maintenance/${ids.maintenanceId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${managerLogin.data.token}` },
      body: JSON.stringify({
        status: "IN_PROGRESS",
        assignedToUserId: maintenanceUser.data.user.id
      })
    });

    const payment = await api(baseUrl, "/api/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${managerLogin.data.token}` },
      body: JSON.stringify({
        lease: ids.leaseId,
        amount: 1800,
        method: "BANK_TRANSFER"
      })
    });
    ids.paymentId = payment.data.payment._id;

    const leases = await api(baseUrl, "/api/leases", {
      headers: { Authorization: `Bearer ${tenantLogin.data.token}` }
    });

    const payments = await api(baseUrl, "/api/payments", {
      headers: { Authorization: `Bearer ${tenantLogin.data.token}` }
    });

    console.log(
      JSON.stringify(
        {
          mode: "jwt",
          checks: {
            privilegedRegistrationBlocked,
            tenantRegistered: tenantRegistration.data.user.email === tenantEmail,
            maintenanceCreated: maintenanceUser.data.user.role === "MAINTENANCE",
            propertyCreated: property.data.property.title === "Smoke Test Unit",
            applicationApproved: true,
            tenantSeesLease: leases.data.count === 1,
            tenantSeesPayment: payments.data.count === 1
          }
        },
        null,
        2
      )
    );
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (ids.paymentId) {
      await Payment.findByIdAndDelete(ids.paymentId);
    }
    if (ids.maintenanceId) {
      await MaintenanceRequest.findByIdAndDelete(ids.maintenanceId);
    }
    if (ids.leaseId) {
      await Lease.findByIdAndDelete(ids.leaseId);
    }
    if (ids.applicationId) {
      await Application.findByIdAndDelete(ids.applicationId);
    }
    if (ids.propertyId) {
      await Property.findByIdAndDelete(ids.propertyId);
    }
    if (ids.userIds.length) {
      await User.deleteMany({ _id: { $in: ids.userIds } });
    }

    await connection.disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
