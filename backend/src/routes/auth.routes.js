const router = require("express").Router();

const c = require("../controllers/auth.controller");
const { protect, authorize, requireJwtMode } = require("../middleware/auth.middleware");
const { ROLES } = require("../utils/constants");

router.post("/register", requireJwtMode, c.register);
router.post("/login", requireJwtMode, c.login);
router.post("/users", requireJwtMode, protect, authorize(ROLES.MANAGER), c.createManagedUser);
router.get("/me", protect, c.me);

module.exports = router;
