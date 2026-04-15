const router = require("express").Router();
const { keycloakProtect } = require("../middleware/keycloak.middleware");
const { isKeycloakEnabled, keycloakConfig } = require("../config/keycloak");

/**
 * GET /api/keycloak/info
 * Check if Keycloak is enabled and get configuration info
 */
router.get("/info", (req, res) => {
  if (!isKeycloakEnabled()) {
    return res.status(503).json({
      enabled: false,
      message: "Keycloak is not configured"
    });
  }

  res.json({
    enabled: true,
    authServerUrl: keycloakConfig.authServerUrl,
    realm: keycloakConfig.realm,
    clientId: keycloakConfig.clientId,
    bearerOnly: keycloakConfig.bearerOnly,
    message: "Keycloak is enabled for delegated authentication"
  });
});

/**
 * GET /api/keycloak/me
 * Get current Keycloak-authenticated user profile
 * Requires valid Keycloak bearer token
 * IMPORTANT: User is NOT returned from database, only from token
 */
router.get("/me", keycloakProtect, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Return user data from Keycloak token (not from database)
    res.json({
      user: {
        id: req.user.keycloakId,
        email: req.user.email,
        fullName: req.user.fullName,
        role: req.user.role,
        source: "keycloak", // Explicitly indicate external authentication
        _note: "User data from Keycloak - no database entry created"
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

/**
 * GET /api/keycloak/verify-token
 * Verify a Keycloak token without creating a database entry
 * Used for token validation
 */
router.get("/verify-token", keycloakProtect, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    message: "Token is valid and user is authenticated via Keycloak"
  });
});

/**
 * POST /api/keycloak/logout
 * Logout endpoint for Keycloak
 * In delegated mode, logout is handled by Keycloak itself
 */
router.post("/logout", keycloakProtect, (req, res) => {
  try {
    // Clear the token from the client side
    // In a full implementation, also invalidate the token on Keycloak side
    res.json({
      message: "Logout successful. Token should be discarded.",
      logoutUrl: `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(
        process.env.FRONTEND_URL || "http://localhost:3000"
      )}`
    });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

module.exports = router;
