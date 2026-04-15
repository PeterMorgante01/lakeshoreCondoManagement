require("dotenv").config();

const http = require("http");
const https = require("https");

const app = require("../src/app");
const Application = require("../src/models/Application");
const connectDB = require("../src/config/db");
const Property = require("../src/models/Property");

function postForm(urlString, formData) {
  const url = new URL(urlString);
  const payload = new URLSearchParams(formData).toString();
  const transport = url.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const body = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new Error(
                  `Token request failed with ${res.statusCode}: ${JSON.stringify(body)}`
                )
              );
              return;
            }
            resolve(body);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

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
  let server;
  let propertyId = null;
  let applicationId = null;

  try {
    const authServerUrl = String(process.env.KEYCLOAK_AUTH_SERVER_URL || "").replace(/\/+$/, "");
    const tokenUrl = `${authServerUrl}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

    const managerToken = await postForm(tokenUrl, {
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      grant_type: "password",
      username: "manager1",
      password: "Manager123!"
    });

    const tenantToken = await postForm(tokenUrl, {
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      grant_type: "password",
      username: "tenant1",
      password: "Tenant123!"
    });

    server = app.listen(0);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const managerProfile = await api(baseUrl, "/api/keycloak/me", {
      headers: { Authorization: `Bearer ${managerToken.access_token}` }
    });

    const property = await api(baseUrl, "/api/properties", {
      method: "POST",
      headers: { Authorization: `Bearer ${managerToken.access_token}` },
      body: JSON.stringify({
        title: `Keycloak Smoke Unit ${stamp}`,
        address: "300 Keycloak Ave",
        city: "Toronto",
        rentAmount: 2050
      })
    });
    propertyId = property.data.property._id;

    const tenantApplication = await api(baseUrl, "/api/applications", {
      method: "POST",
      headers: { Authorization: `Bearer ${tenantToken.access_token}` },
      body: JSON.stringify({
        property: propertyId,
        monthlyIncome: 5100,
        message: "Applying with a Keycloak token"
      })
    });
    applicationId = tenantApplication.data.application._id;

    console.log(
      JSON.stringify(
        {
          mode: "keycloak-live",
          checks: {
            managerRoleMapped: managerProfile.user.role === "MANAGER",
            managerIdentityNotProvisioned: managerProfile.user.source === "keycloak",
            managerCreatedProperty: !!propertyId,
            tenantCreatedApplication: !!applicationId
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

    if (applicationId) {
      await Application.findByIdAndDelete(applicationId);
    }
    if (propertyId) {
      await Property.findByIdAndDelete(propertyId);
    }

    await connection.disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
