const router = require("express").Router();
const c = require("../controllers/maintenance.controller");

router.post("/", c.createMaintenance);
router.get("/", c.getMaintenance);
router.patch("/:id/status", c.updateMaintenanceStatus);

module.exports = router;