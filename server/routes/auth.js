const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "ข้อมูลไม่ถูกต้อง",
      errors: errors.array(),
    });
  }
  next();
};

// Login validation rules
const loginValidation = [
  body("email").isEmail().withMessage("รูปแบบอีเมลไม่ถูกต้อง").normalizeEmail(),
  body("password").notEmpty().withMessage("กรุณากรอกรหัสผ่าน"),
];

// Note: Registration is only available through admin user management
// POST /api/users (admin only) - see routes/users.js

router.post("/login", loginValidation, validate, login);
router.get("/me", protect, getMe);

module.exports = router;
