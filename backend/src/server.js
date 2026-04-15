require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { validateAuthConfiguration } = require("./config/keycloak");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    validateAuthConfiguration();

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
})();
