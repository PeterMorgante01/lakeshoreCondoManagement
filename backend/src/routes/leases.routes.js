const router = require("express").Router();
const c = require("../controllers/leases.controller");

router.post("/", c.createLease);
router.get("/", c.getLeases);

module.exports = router;