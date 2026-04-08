const router = require("express").Router();
const c = require("../controllers/applications.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ROLES } = require("../utils/constants");

router.post("/", protect, authorize(ROLES.TENANT), c.createApplication);
router.get("/", protect, c.getApplications);
router.patch("/:id/status", protect, authorize(ROLES.MANAGER), c.updateApplicationStatus);

module.exports = router;