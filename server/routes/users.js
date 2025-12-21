const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSupervisors,
  updateProfile,
  updateProfileImage,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/auth");

// Multer config for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const uploadProfile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpeg, jpg, png, gif, webp)"));
  },
});

// Profile routes (for logged-in users to edit their own profile)
router.put("/profile", protect, updateProfile);
router.put(
  "/profile/image",
  protect,
  uploadProfile.single("profileImage"),
  updateProfileImage
);

router.get("/supervisors", getSupervisors); // Public - needed for registration
router
  .route("/")
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router
  .route("/:id")
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
