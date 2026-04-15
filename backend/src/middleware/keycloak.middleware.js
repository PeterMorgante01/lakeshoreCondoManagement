const http = require("http");
const https = require("https");
const jwt = require("jsonwebtoken");

const { isKeycloakEnabled, keycloakConfig } = require("../config/keycloak");
const { mapKeycloakTokenToUser, isValidKeycloakToken } = require("../utils/keycloak.mapper");

let cachedKeys = null;
let keyCacheExpiry = 0;

function buildIssuer() {
  return `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.realm}`;
}

async function getKeycloakPublicKeys() {
  const now = Date.now();

  if (cachedKeys && now < keyCacheExpiry) {
    return cachedKeys;
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${buildIssuer()}/protocol/openid-connect/certs`);
    const transport = url.protocol === "http:" ? http : https;

    transport
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Keycloak JWKS request failed with status ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const certs = JSON.parse(data);
            if (!Array.isArray(certs.keys) || !certs.keys.length) {
              reject(new Error("No signing keys found in Keycloak JWKS"));
              return;
            }

            cachedKeys = certs.keys;
            keyCacheExpiry = now + 60 * 60 * 1000;
            resolve(certs.keys);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

function x5cToPem(certificate) {
  const lines = certificate.match(/.{1,64}/g) || [certificate];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

function tokenMatchesClient(payload) {
  const expectedClientId = keycloakConfig.clientId;
  if (!expectedClientId) {
    return true;
  }

  const audience = Array.isArray(payload.aud)
    ? payload.aud
    : payload.aud
      ? [payload.aud]
      : [];

  return payload.azp === expectedClientId || audience.includes(expectedClientId);
}

async function verifyKeycloakToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.payload || !decoded?.header) {
    throw new Error("Invalid token format");
  }

  const keys = await getKeycloakPublicKeys();
  const key = keys.find((entry) => entry.kid === decoded.header.kid) || keys[0];

  if (!key?.x5c?.length) {
    throw new Error("Keycloak signing certificate not found");
  }

  const payload = jwt.verify(token, x5cToPem(key.x5c[0]), {
    algorithms: ["RS256"],
    issuer: buildIssuer()
  });

  if (!tokenMatchesClient(payload)) {
    throw new Error("Token audience does not match this API client");
  }

  if (!isValidKeycloakToken(payload)) {
    throw new Error("Invalid or expired Keycloak token");
  }

  return payload;
}

function extractKeycloakToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function keycloakProtect(req, res, next) {
  try {
    if (!isKeycloakEnabled()) {
      return res.status(501).json({ error: "Keycloak not configured" });
    }

    const token = extractKeycloakToken(req);
    if (!token) {
      return res.status(401).json({ error: "Keycloak authentication required" });
    }

    try {
      const payload = await verifyKeycloakToken(token);
      req.user = mapKeycloakTokenToUser(payload);
      req.keycloakToken = token;
      req.authSource = "keycloak";
      return next();
    } catch (verifyErr) {
      return res.status(401).json({
        error: "Token verification failed",
        details: verifyErr.message
      });
    }
  } catch (err) {
    console.error("Keycloak protection error:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

function keycloakAuthorize(...allowedRoles) {
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

module.exports = {
  keycloakProtect,
  keycloakAuthorize,
  getKeycloakPublicKeys,
  extractKeycloakToken,
  verifyKeycloakToken
};
