require("dotenv").config();

const bcrypt = require("bcryptjs");

const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");
const { validateAuthConfiguration, getAuthMode } = require("./config/keycloak");
const { AUTH_MODES, ROLES } = require("./utils/constants");

const PORT = process.env.PORT || 5000;
const SERVICE_ROLE = process.env.SERVICE_ROLE || "monolith";

async function bootstrapManagerIfConfigured() {
  if (getAuthMode() !== AUTH_MODES.JWT) {
    return;
  }

  const fullName = process.env.BOOTSTRAP_MANAGER_NAME;
  const email = process.env.BOOTSTRAP_MANAGER_EMAIL;
  const password = process.env.BOOTSTRAP_MANAGER_PASSWORD;

  if (!fullName || !email || !password) {
    return;
  }

  if (password.length < 8) {
    throw new Error("BOOTSTRAP_MANAGER_PASSWORD must be at least 8 characters");
  }

  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    fullName,
    email: normalizedEmail,
    passwordHash,
    role: ROLES.MANAGER
  });

  console.log(`Bootstrap manager created: ${normalizedEmail}`);
}

(async () => {
  try {
    validateAuthConfiguration();

    await connectDB();
    await bootstrapManagerIfConfigured();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT} (service role: ${SERVICE_ROLE})`
      );
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
})();
