const router = require("express").Router();
const c = require("../controllers/applications.controller");

router.post("/", c.createApplication);
router.get("/", c.getApplications);
router.patch("/:id/status", c.updateApplicationStatus);

module.exports = router;