const router = require("express").Router();
const c = require("../controllers/properties.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { ROLES } = require("../utils/constants");

router.post("/", protect, authorize(ROLES.MANAGER), c.createProperty);
router.get("/", c.getAllProperties);
router.get("/:id", c.getPropertyById);
router.patch("/:id", protect, authorize(ROLES.MANAGER), c.updateProperty);

module.exports = router;