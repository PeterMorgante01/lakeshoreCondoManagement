const router = require("express").Router();
const c = require("../controllers/payments.controller");

router.post("/", c.createPayment);
router.get("/", c.getPayments);

module.exports = router;