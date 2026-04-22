const router = require("express").Router();
const c = require("../controllers/maintenance.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ROLES } = require("../utils/constants");

router.post("/", protect, authorize(ROLES.TENANT), c.createMaintenance);
router.get("/", protect, c.getMaintenance);
router.patch(
	"/:id/status",
	protect,
	authorize(ROLES.MANAGER, ROLES.MAINTENANCE),
	c.updateMaintenanceStatus
);
router.delete("/:id", protect, authorize(ROLES.MANAGER), c.deleteMaintenance);

module.exports = router;
