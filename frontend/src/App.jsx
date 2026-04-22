import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import {
  APPLICATION_STATUSES,
  MAINTENANCE_STATUSES,
  PAYMENT_METHODS,
  ROLES
} from "./constants";

const STORAGE_KEY = "lakeshore.auth";

function toCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function toDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function identityText(identity) {
  if (!identity) return "-";
  return `${identity.fullName || "Unknown"} (${identity.role || "N/A"})`;
}

function Section({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [systemStatus, setSystemStatus] = useState(null);
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [leases, setLeases] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: ROLES.MAINTENANCE
  });
  const [propertyForm, setPropertyForm] = useState({
    title: "",
    address: "",
    city: "",
    rentAmount: ""
  });
  const [applicationForm, setApplicationForm] = useState({
    property: "",
    monthlyIncome: "",
    message: ""
  });
  const [applicationStatusForm, setApplicationStatusForm] = useState({
    id: "",
    status: "UNDER_REVIEW"
  });
  const [leaseForm, setLeaseForm] = useState({
    applicationId: "",
    startDate: "",
    endDate: "",
    rentAmount: ""
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    lease: "",
    title: "",
    description: ""
  });
  const [maintenanceStatusForm, setMaintenanceStatusForm] = useState({
    id: "",
    status: "IN_PROGRESS",
    assignedToUserId: "",
    assignedSubject: "",
    assignedEmail: "",
    assignedFullName: "",
    assignedSource: "jwt"
  });
  const [paymentForm, setPaymentForm] = useState({
    lease: "",
    amount: "",
    method: "CARD",
    paidAt: ""
  });
  const [deleteForm, setDeleteForm] = useState({
    resource: "properties",
    id: ""
  });

  const authToken = auth?.token;
  const role = auth?.user?.role;

  const dataCounts = useMemo(
    () => [
      { label: "Properties", value: properties.length },
      { label: "Applications", value: applications.length },
      { label: "Leases", value: leases.length },
      { label: "Maintenance", value: maintenance.length },
      { label: "Payments", value: payments.length }
    ],
    [applications.length, leases.length, maintenance.length, payments.length, properties.length]
  );

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      const [statusResponse, propertiesResponse] = await Promise.all([
        apiRequest("/status"),
        apiRequest("/properties")
      ]);

      setSystemStatus(statusResponse);
      setProperties(propertiesResponse?.properties || []);

      if (!authToken) {
        setApplications([]);
        setLeases([]);
        setMaintenance([]);
        setPayments([]);
        return;
      }

      const [me, applicationsResponse, leasesResponse, maintenanceResponse, paymentsResponse] =
        await Promise.all([
          apiRequest("/auth/me", { token: authToken }),
          apiRequest("/applications", { token: authToken }),
          apiRequest("/leases", { token: authToken }),
          apiRequest("/maintenance", { token: authToken }),
          apiRequest("/payments", { token: authToken })
        ]);

      setAuth((prev) => {
        if (!prev) return prev;
        return { ...prev, user: me.user || prev.user };
      });

      setApplications(applicationsResponse?.applications || []);
      setLeases(leasesResponse?.leases || []);
      setMaintenance(maintenanceResponse?.maintenance || []);
      setPayments(paymentsResponse?.payments || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!auth) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  async function handleLogin(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("login");

    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: loginForm
      });

      setAuth({ token: response.token, user: response.user });
      setSuccess("Welcome back. You are now logged in.");
      setLoginForm({ email: "", password: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("register");

    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: registerForm
      });

      setAuth({ token: response.token, user: response.user });
      setSuccess("Tenant account created and authenticated.");
      setRegisterForm({ fullName: "", email: "", password: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  function handleLogout() {
    clearMessages();
    setAuth(null);
    setSuccess("Signed out.");
  }

  async function managerCreateUser(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("create-user");

    try {
      await apiRequest("/auth/users", {
        method: "POST",
        token: authToken,
        body: userForm
      });

      setSuccess("Managed user created.");
      setUserForm({ fullName: "", email: "", password: "", role: ROLES.MAINTENANCE });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function managerCreateProperty(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("create-property");

    try {
      await apiRequest("/properties", {
        method: "POST",
        token: authToken,
        body: {
          ...propertyForm,
          rentAmount: Number(propertyForm.rentAmount)
        }
      });

      setSuccess("Property created.");
      setPropertyForm({ title: "", address: "", city: "", rentAmount: "" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function tenantCreateApplication(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("create-application");

    try {
      await apiRequest("/applications", {
        method: "POST",
        token: authToken,
        body: {
          property: applicationForm.property,
          monthlyIncome: Number(applicationForm.monthlyIncome),
          message: applicationForm.message
        }
      });

      setSuccess("Application submitted.");
      setApplicationForm({ property: "", monthlyIncome: "", message: "" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function managerUpdateApplicationStatus(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("update-application");

    try {
      await apiRequest(`/applications/${applicationStatusForm.id}/status`, {
        method: "PATCH",
        token: authToken,
        body: { status: applicationStatusForm.status }
      });

      setSuccess("Application status updated.");
      setApplicationStatusForm({ id: "", status: "UNDER_REVIEW" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function managerCreateLease(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("create-lease");

    try {
      const body = {
        applicationId: leaseForm.applicationId,
        startDate: leaseForm.startDate,
        endDate: leaseForm.endDate
      };

      if (leaseForm.rentAmount) {
        body.rentAmount = Number(leaseForm.rentAmount);
      }

      await apiRequest("/leases", {
        method: "POST",
        token: authToken,
        body
      });

      setSuccess("Lease created.");
      setLeaseForm({ applicationId: "", startDate: "", endDate: "", rentAmount: "" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function tenantCreateMaintenance(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("create-maintenance");

    try {
      await apiRequest("/maintenance", {
        method: "POST",
        token: authToken,
        body: maintenanceForm
      });

      setSuccess("Maintenance request created.");
      setMaintenanceForm({ lease: "", title: "", description: "" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function updateMaintenanceStatus(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("update-maintenance");

    try {
      const body = { status: maintenanceStatusForm.status };

      if (role === ROLES.MANAGER && maintenanceStatusForm.assignedToUserId) {
        body.assignedToUserId = maintenanceStatusForm.assignedToUserId;
      } else if (
        role === ROLES.MANAGER &&
        maintenanceStatusForm.assignedSubject &&
        maintenanceStatusForm.assignedEmail &&
        maintenanceStatusForm.assignedFullName
      ) {
        body.assignedToIdentity = {
          subject: maintenanceStatusForm.assignedSubject,
          email: maintenanceStatusForm.assignedEmail,
          fullName: maintenanceStatusForm.assignedFullName,
          authSource: maintenanceStatusForm.assignedSource,
          role: ROLES.MAINTENANCE
        };
      }

      await apiRequest(`/maintenance/${maintenanceStatusForm.id}/status`, {
        method: "PATCH",
        token: authToken,
        body
      });

      setSuccess("Maintenance request updated.");
      setMaintenanceStatusForm({
        id: "",
        status: "IN_PROGRESS",
        assignedToUserId: "",
        assignedSubject: "",
        assignedEmail: "",
        assignedFullName: "",
        assignedSource: "jwt"
      });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function managerCreatePayment(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("create-payment");

    try {
      const body = {
        lease: paymentForm.lease,
        amount: Number(paymentForm.amount),
        method: paymentForm.method
      };

      if (paymentForm.paidAt) {
        body.paidAt = paymentForm.paidAt;
      }

      await apiRequest("/payments", {
        method: "POST",
        token: authToken,
        body
      });

      setSuccess("Payment recorded.");
      setPaymentForm({ lease: "", amount: "", method: "CARD", paidAt: "" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function managerDeleteResource(event) {
    event.preventDefault();
    clearMessages();
    setBusyAction("delete-resource");

    try {
      await apiRequest(`/${deleteForm.resource}/${deleteForm.id}`, {
        method: "DELETE",
        token: authToken
      });

      setSuccess(`${deleteForm.resource.slice(0, -1)} deleted.`);
      setDeleteForm({ resource: "properties", id: "" });
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  }

  const approvedApplications = applications.filter(
    (application) => application.status === "APPROVED"
  );

  return (
    <div className="app-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <main className="content">
        <header className="hero">
          <h1>Lakeshore Condo Management</h1>
        </header>

        {error ? <div className="notice error">{error}</div> : null}
        {success ? <div className="notice success">{success}</div> : null}

        {!auth ? (
          <div className="auth-grid">
            <Section
              title="Sign In"
            >
              <form onSubmit={handleLogin} className="form-grid">
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </label>
                <button type="submit" disabled={busyAction === "login"}>
                  {busyAction === "login" ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </Section>

            <Section title="Register Tenant">
              <form onSubmit={handleRegister} className="form-grid">
                <label>
                  Full Name
                  <input
                    type="text"
                    required
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </label>
                <button type="submit" disabled={busyAction === "register"}>
                  {busyAction === "register" ? "Creating account..." : "Create Tenant Account"}
                </button>
              </form>
            </Section>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <div>
                <strong>{auth.user?.fullName}</strong>
                <p>
                  {auth.user?.email} · Role: <span className="role-pill">{auth.user?.role}</span>
                </p>
              </div>
              <div className="toolbar-actions">
                <button onClick={refreshData} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh Data"}
                </button>
                <button onClick={handleLogout} className="danger">
                  Sign Out
                </button>
              </div>
            </div>

            <div className="stats-grid">
              {dataCounts.map((item) => (
                <article key={item.label} className="stat-card">
                  <h3>{item.label}</h3>
                  <p>{item.value}</p>
                </article>
              ))}
            </div>

            <Section title="Properties" subtitle="Available rental inventory.">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>City</th>
                      <th>Address</th>
                      <th>Rent</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((item) => (
                      <tr key={item._id}>
                        <td>{item.title}</td>
                        <td>{item.city}</td>
                        <td>{item.address}</td>
                        <td>{toCurrency(item.rentAmount)}</td>
                        <td>{item.isActive ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Applications" subtitle="Tenant applications and approval workflow.">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Income</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((item) => (
                      <tr key={item._id}>
                        <td className="mono">{item._id}</td>
                        <td>{identityText(item.tenant)}</td>
                        <td>{item.property?.title || "-"}</td>
                        <td>{toCurrency(item.monthlyIncome)}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Leases" subtitle="Current and historical lease agreements.">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Rent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leases.map((item) => (
                      <tr key={item._id}>
                        <td className="mono">{item._id}</td>
                        <td>{identityText(item.tenant)}</td>
                        <td>{item.property?.title || "-"}</td>
                        <td>{toDate(item.startDate)}</td>
                        <td>{toDate(item.endDate)}</td>
                        <td>{toCurrency(item.rentAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Maintenance" subtitle="Repair and service lifecycle.">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tenant</th>
                      <th>Lease</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((item) => (
                      <tr key={item._id}>
                        <td className="mono">{item._id}</td>
                        <td>{identityText(item.tenant)}</td>
                        <td className="mono">{item.lease?._id || item.lease}</td>
                        <td>{item.title}</td>
                        <td>{item.status}</td>
                        <td>{identityText(item.assignedTo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Payments" subtitle="Recorded rent payments and methods.">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Lease</th>
                      <th>Tenant</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item) => (
                      <tr key={item._id}>
                        <td className="mono">{item._id}</td>
                        <td className="mono">{item.lease?._id || "-"}</td>
                        <td>{identityText(item.lease?.tenant)}</td>
                        <td>{toCurrency(item.amount)}</td>
                        <td>{item.method}</td>
                        <td>{toDate(item.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {role === ROLES.MANAGER ? (
              <Section title="Manager Actions" subtitle="Privileged operations enforced by backend roles.">
                <div className="forms-layout">
                  <form onSubmit={managerCreateUser} className="form-grid">
                    <h3>Create Staff/User</h3>
                    <label>
                      Full Name
                      <input
                        value={userForm.fullName}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, fullName: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        minLength={8}
                        value={userForm.password}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Role
                      <select
                        value={userForm.role}
                        onChange={(event) =>
                          setUserForm((prev) => ({ ...prev, role: event.target.value }))
                        }
                      >
                        <option value={ROLES.TENANT}>TENANT</option>
                        <option value={ROLES.MANAGER}>MANAGER</option>
                        <option value={ROLES.MAINTENANCE}>MAINTENANCE</option>
                      </select>
                    </label>
                    <button type="submit" disabled={busyAction === "create-user"}>
                      {busyAction === "create-user" ? "Creating..." : "Create User"}
                    </button>
                  </form>

                  <form onSubmit={managerCreateProperty} className="form-grid">
                    <h3>Create Property</h3>
                    <label>
                      Title
                      <input
                        required
                        value={propertyForm.title}
                        onChange={(event) =>
                          setPropertyForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Address
                      <input
                        required
                        value={propertyForm.address}
                        onChange={(event) =>
                          setPropertyForm((prev) => ({ ...prev, address: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      City
                      <input
                        required
                        value={propertyForm.city}
                        onChange={(event) =>
                          setPropertyForm((prev) => ({ ...prev, city: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Rent Amount
                      <input
                        required
                        type="number"
                        min={0}
                        value={propertyForm.rentAmount}
                        onChange={(event) =>
                          setPropertyForm((prev) => ({ ...prev, rentAmount: event.target.value }))
                        }
                      />
                    </label>
                    <button type="submit" disabled={busyAction === "create-property"}>
                      {busyAction === "create-property" ? "Saving..." : "Create Property"}
                    </button>
                  </form>

                  <form onSubmit={managerUpdateApplicationStatus} className="form-grid">
                    <h3>Update Application</h3>
                    <label>
                      Application ID
                      <input
                        required
                        value={applicationStatusForm.id}
                        onChange={(event) =>
                          setApplicationStatusForm((prev) => ({ ...prev, id: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={applicationStatusForm.status}
                        onChange={(event) =>
                          setApplicationStatusForm((prev) => ({ ...prev, status: event.target.value }))
                        }
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={busyAction === "update-application"}>
                      {busyAction === "update-application" ? "Updating..." : "Update Application"}
                    </button>
                  </form>

                  <form onSubmit={managerCreateLease} className="form-grid">
                    <h3>Create Lease</h3>
                    <label>
                      Approved Application
                      <select
                        required
                        value={leaseForm.applicationId}
                        onChange={(event) =>
                          setLeaseForm((prev) => ({ ...prev, applicationId: event.target.value }))
                        }
                      >
                        <option value="">Select application</option>
                        {approvedApplications.map((application) => (
                          <option key={application._id} value={application._id}>
                            {application._id} - {application.property?.title || "Property"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Start Date
                      <input
                        required
                        type="date"
                        value={leaseForm.startDate}
                        onChange={(event) =>
                          setLeaseForm((prev) => ({ ...prev, startDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      End Date
                      <input
                        required
                        type="date"
                        value={leaseForm.endDate}
                        onChange={(event) =>
                          setLeaseForm((prev) => ({ ...prev, endDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Rent Amount (optional)
                      <input
                        type="number"
                        min={0}
                        value={leaseForm.rentAmount}
                        onChange={(event) =>
                          setLeaseForm((prev) => ({ ...prev, rentAmount: event.target.value }))
                        }
                      />
                    </label>
                    <button type="submit" disabled={busyAction === "create-lease"}>
                      {busyAction === "create-lease" ? "Creating..." : "Create Lease"}
                    </button>
                  </form>

                  <form onSubmit={updateMaintenanceStatus} className="form-grid">
                    <h3>Update Maintenance</h3>
                    <label>
                      Maintenance ID
                      <input
                        required
                        value={maintenanceStatusForm.id}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({ ...prev, id: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={maintenanceStatusForm.status}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({ ...prev, status: event.target.value }))
                        }
                      >
                        {MAINTENANCE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Assign by User ID (optional)
                      <input
                        value={maintenanceStatusForm.assignedToUserId}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({
                            ...prev,
                            assignedToUserId: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label>
                      Assign Subject (optional)
                      <input
                        value={maintenanceStatusForm.assignedSubject}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({
                            ...prev,
                            assignedSubject: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label>
                      Assign Email (optional)
                      <input
                        type="email"
                        value={maintenanceStatusForm.assignedEmail}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({
                            ...prev,
                            assignedEmail: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label>
                      Assign Full Name (optional)
                      <input
                        value={maintenanceStatusForm.assignedFullName}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({
                            ...prev,
                            assignedFullName: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label>
                      Assign Source
                      <select
                        value={maintenanceStatusForm.assignedSource}
                        onChange={(event) =>
                          setMaintenanceStatusForm((prev) => ({
                            ...prev,
                            assignedSource: event.target.value
                          }))
                        }
                      >
                        <option value="jwt">jwt</option>
                        <option value="keycloak">keycloak</option>
                      </select>
                    </label>
                    <button type="submit" disabled={busyAction === "update-maintenance"}>
                      {busyAction === "update-maintenance" ? "Updating..." : "Update Maintenance"}
                    </button>
                  </form>

                  <form onSubmit={managerCreatePayment} className="form-grid">
                    <h3>Record Payment</h3>
                    <label>
                      Lease
                      <select
                        required
                        value={paymentForm.lease}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, lease: event.target.value }))
                        }
                      >
                        <option value="">Select lease</option>
                        {leases.map((lease) => (
                          <option key={lease._id} value={lease._id}>
                            {lease._id} - {lease.property?.title || "Property"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Amount
                      <input
                        required
                        type="number"
                        min={1}
                        value={paymentForm.amount}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Method
                      <select
                        value={paymentForm.method}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, method: event.target.value }))
                        }
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Paid At (optional)
                      <input
                        type="datetime-local"
                        value={paymentForm.paidAt}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, paidAt: event.target.value }))
                        }
                      />
                    </label>
                    <button type="submit" disabled={busyAction === "create-payment"}>
                      {busyAction === "create-payment" ? "Saving..." : "Record Payment"}
                    </button>
                  </form>

                  <form onSubmit={managerDeleteResource} className="form-grid">
                    <h3>Delete Resource</h3>
                    <label>
                      Resource Type
                      <select
                        value={deleteForm.resource}
                        onChange={(event) =>
                          setDeleteForm((prev) => ({ ...prev, resource: event.target.value }))
                        }
                      >
                        <option value="properties">Property</option>
                        <option value="applications">Application</option>
                        <option value="leases">Lease</option>
                        <option value="maintenance">Maintenance Request</option>
                        <option value="payments">Payment</option>
                      </select>
                    </label>
                    <label>
                      Resource ID
                      <input
                        required
                        value={deleteForm.id}
                        onChange={(event) =>
                          setDeleteForm((prev) => ({ ...prev, id: event.target.value }))
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      className="danger"
                      disabled={busyAction === "delete-resource"}
                    >
                      {busyAction === "delete-resource" ? "Deleting..." : "Delete Resource"}
                    </button>
                  </form>
                </div>
              </Section>
            ) : null}

            {role === ROLES.TENANT ? (
              <Section title="Tenant Actions" subtitle="Self-service workflows for applicants and residents.">
                <div className="forms-layout tenant-layout">
                  <form onSubmit={tenantCreateApplication} className="form-grid">
                    <h3>Submit Application</h3>
                    <label>
                      Property
                      <select
                        required
                        value={applicationForm.property}
                        onChange={(event) =>
                          setApplicationForm((prev) => ({ ...prev, property: event.target.value }))
                        }
                      >
                        <option value="">Select property</option>
                        {properties
                          .filter((property) => property.isActive)
                          .map((property) => (
                            <option key={property._id} value={property._id}>
                              {property.title} - {property.city}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Monthly Income
                      <input
                        required
                        type="number"
                        min={0}
                        value={applicationForm.monthlyIncome}
                        onChange={(event) =>
                          setApplicationForm((prev) => ({
                            ...prev,
                            monthlyIncome: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label>
                      Message
                      <textarea
                        value={applicationForm.message}
                        onChange={(event) =>
                          setApplicationForm((prev) => ({ ...prev, message: event.target.value }))
                        }
                      />
                    </label>
                    <button type="submit" disabled={busyAction === "create-application"}>
                      {busyAction === "create-application" ? "Submitting..." : "Submit Application"}
                    </button>
                  </form>

                  <form onSubmit={tenantCreateMaintenance} className="form-grid">
                    <h3>Create Maintenance Request</h3>
                    <label>
                      Lease
                      <select
                        required
                        value={maintenanceForm.lease}
                        onChange={(event) =>
                          setMaintenanceForm((prev) => ({ ...prev, lease: event.target.value }))
                        }
                      >
                        <option value="">Select lease</option>
                        {leases.map((lease) => (
                          <option key={lease._id} value={lease._id}>
                            {lease._id} - {lease.property?.title || "Property"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Title
                      <input
                        required
                        value={maintenanceForm.title}
                        onChange={(event) =>
                          setMaintenanceForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        required
                        value={maintenanceForm.description}
                        onChange={(event) =>
                          setMaintenanceForm((prev) => ({
                            ...prev,
                            description: event.target.value
                          }))
                        }
                      />
                    </label>
                    <button type="submit" disabled={busyAction === "create-maintenance"}>
                      {busyAction === "create-maintenance"
                        ? "Creating..."
                        : "Create Request"}
                    </button>
                  </form>
                </div>
              </Section>
            ) : null}

            {role === ROLES.MAINTENANCE ? (
              <Section title="Maintenance Actions" subtitle="Status updates for assigned or unassigned work items.">
                <form onSubmit={updateMaintenanceStatus} className="form-grid single-form">
                  <label>
                    Maintenance ID
                    <input
                      required
                      value={maintenanceStatusForm.id}
                      onChange={(event) =>
                        setMaintenanceStatusForm((prev) => ({ ...prev, id: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={maintenanceStatusForm.status}
                      onChange={(event) =>
                        setMaintenanceStatusForm((prev) => ({ ...prev, status: event.target.value }))
                      }
                    >
                      {MAINTENANCE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" disabled={busyAction === "update-maintenance"}>
                    {busyAction === "update-maintenance" ? "Updating..." : "Update Request"}
                  </button>
                </form>
              </Section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
