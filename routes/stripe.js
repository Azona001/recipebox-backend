const express = require("express");
const { createCheckoutSession } = require("../controllers/stripeController");
const verifyToken = require("../middleware/auth");
const attachUser = require("../middleware/attachUser");

const router = express.Router();

router.use(verifyToken);
router.use(attachUser);

router.post("/create-checkout-session", createCheckoutSession);

module.exports = router;
