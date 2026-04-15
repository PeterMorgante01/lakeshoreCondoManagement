const mongoose = require("mongoose");

const { AUTH_SOURCES } = require("./constants");

function getAuthSource(user) {
  if (!user) return null;

  if (user.authSource) return user.authSource;
  if (user.source) return user.source;
  if (user.isKeycloakUser) return AUTH_SOURCES.KEYCLOAK;

  return AUTH_SOURCES.JWT;
}

function getUserSubject(user) {
  if (!user) return null;

  if (user.subject) return String(user.subject);
  if (user.keycloakId) return String(user.keycloakId);
  if (user.id) return String(user.id);
  if (user._id) return String(user._id);

  return null;
}

function getLegacyUserId(user) {
  if (!user || getAuthSource(user) !== AUTH_SOURCES.JWT || !user._id) {
    return null;
  }

  return mongoose.isValidObjectId(user._id) ? user._id : null;
}

function buildIdentitySnapshot(user, overrides = {}) {
  const subject = overrides.subject || getUserSubject(user);
  const authSource = overrides.authSource || getAuthSource(user);
  const email = overrides.email || user?.email;
  const fullName = overrides.fullName || user?.fullName;
  const role = overrides.role || user?.role;

  if (!subject || !authSource || !email || !fullName || !role) {
    throw new Error("Unable to build identity snapshot from user context");
  }

  return {
    subject,
    authSource,
    email: email.toLowerCase(),
    fullName,
    role
  };
}

function toRequestUser(userDoc) {
  if (getAuthSource(userDoc) === AUTH_SOURCES.KEYCLOAK) {
    return {
      id: getUserSubject(userDoc),
      subject: getUserSubject(userDoc),
      email: userDoc.email,
      fullName: userDoc.fullName,
      role: userDoc.role,
      authSource: AUTH_SOURCES.KEYCLOAK,
      isKeycloakUser: true
    };
  }

  return {
    _id: userDoc._id,
    id: userDoc._id.toString(),
    subject: userDoc._id.toString(),
    email: userDoc.email,
    fullName: userDoc.fullName,
    role: userDoc.role,
    authSource: AUTH_SOURCES.JWT,
    isKeycloakUser: false
  };
}

function buildIdentityQuery(identityField, user, legacyField) {
  const subject = getUserSubject(user);
  const authSource = getAuthSource(user);
  const clauses = [
    {
      [`${identityField}.subject`]: subject,
      [`${identityField}.authSource`]: authSource
    }
  ];

  const legacyUserId = legacyField ? getLegacyUserId(user) : null;
  if (legacyUserId) {
    clauses.push({ [legacyField]: legacyUserId });
  }

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

function matchesIdentity(identity, user, legacyValue) {
  const subject = getUserSubject(user);
  const authSource = getAuthSource(user);

  if (identity?.subject && identity?.authSource) {
    return identity.subject === subject && identity.authSource === authSource;
  }

  const legacyUserId = getLegacyUserId(user);
  if (legacyUserId && legacyValue) {
    return String(legacyValue) === String(legacyUserId);
  }

  return false;
}

function presentIdentity(identity, fallbackUserDoc) {
  if (identity?.subject) {
    return identity;
  }

  if (
    !fallbackUserDoc ||
    typeof fallbackUserDoc !== "object" ||
    !fallbackUserDoc._id ||
    !fallbackUserDoc.email ||
    !fallbackUserDoc.fullName
  ) {
    return null;
  }

  return {
    subject: fallbackUserDoc._id.toString(),
    authSource: AUTH_SOURCES.JWT,
    email: fallbackUserDoc.email,
    fullName: fallbackUserDoc.fullName,
    role: fallbackUserDoc.role
  };
}

module.exports = {
  buildIdentitySnapshot,
  buildIdentityQuery,
  getAuthSource,
  getLegacyUserId,
  getUserSubject,
  matchesIdentity,
  presentIdentity,
  toRequestUser
};
