const router = require("express").Router();
const c = require("../controllers/leases.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ROLES } = require("../utils/constants");

router.post("/", protect, authorize(ROLES.MANAGER), c.createLease);
router.get("/", protect, c.getLeases);

module.exports = router;