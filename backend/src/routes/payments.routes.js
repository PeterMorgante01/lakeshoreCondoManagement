const router = require("express").Router();
const c = require("../controllers/payments.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ROLES } = require("../utils/constants");

router.post("/", protect, authorize(ROLES.MANAGER), c.createPayment);
router.get("/", protect, c.getPayments);

module.exports = router;