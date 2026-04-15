const { AUTH_SOURCES, ROLES } = require("./constants");

/**
 * Maps Keycloak token claims into the application's request user shape.
 * Keycloak users stay external and are never persisted into MongoDB.
 */
function getKeycloakSubject(tokenPayload) {
  return tokenPayload.sub || tokenPayload.preferred_username || tokenPayload.email || null;
}

function mapKeycloakTokenToUser(tokenPayload) {
  if (!tokenPayload) {
    throw new Error("Invalid token payload");
  }

  const keycloakId = getKeycloakSubject(tokenPayload);
  const email = tokenPayload.email || tokenPayload.preferred_username;
  const fullName =
    tokenPayload.name ||
    [tokenPayload.given_name, tokenPayload.family_name].filter(Boolean).join(" ") ||
    email;
  const role = mapKeycloakRoleToAppRole(tokenPayload);

  if (!role) {
    throw new Error("Keycloak token does not include an application role");
  }

  return {
    id: keycloakId,
    subject: keycloakId,
    keycloakId,
    email,
    fullName,
    role,
    isKeycloakUser: true,
    authSource: AUTH_SOURCES.KEYCLOAK,
    source: AUTH_SOURCES.KEYCLOAK
  };
}

function mapKeycloakRoleToAppRole(tokenPayload) {
  const keycloakRoles = tokenPayload?.realm_access?.roles || [];

  if (keycloakRoles.includes("manager")) return ROLES.MANAGER;
  if (keycloakRoles.includes("maintenance")) return ROLES.MAINTENANCE;
  if (keycloakRoles.includes("tenant")) return ROLES.TENANT;

  return null;
}

function isValidKeycloakToken(tokenPayload) {
  return !!(
    tokenPayload &&
    getKeycloakSubject(tokenPayload) &&
    (tokenPayload.email || tokenPayload.preferred_username) &&
    tokenPayload.exp &&
    tokenPayload.iss &&
    tokenPayload.exp * 1000 > Date.now()
  );
}

module.exports = {
  getKeycloakSubject,
  mapKeycloakTokenToUser,
  mapKeycloakRoleToAppRole,
  isValidKeycloakToken
};
