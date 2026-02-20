const router = require("express").Router();
const c = require("../controllers/auth.controller");

router.post("/register", c.register);
router.post("/login", c.login);
router.get("/me", c.me);

module.exports = router;