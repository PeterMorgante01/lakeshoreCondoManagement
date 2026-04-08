const router = require("express").Router();
const c = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", c.register);
router.post("/login", c.login);
router.get("/me", protect, c.me);

module.exports = router;