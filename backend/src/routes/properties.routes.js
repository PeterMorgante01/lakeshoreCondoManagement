const router = require("express").Router();
const c = require("../controllers/properties.controller");

router.post("/", c.createProperty);
router.get("/", c.getAllProperties);
router.get("/:id", c.getPropertyById);
router.patch("/:id", c.updateProperty);

module.exports = router;