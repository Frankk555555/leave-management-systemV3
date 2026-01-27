const express = require("express");
const router = express.Router();
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestById,
  cancelLeaveRequest,
  updateLeaveRequest,
  getTeamLeaveRequests,
  confirmLeaveRequest,
} = require("../controllers/leaveRequestController");
const { protect, admin } = require("../middleware/auth");
const upload = require("../middleware/upload");

router
  .route("/")
  .post(protect, upload.array("attachments", 5), createLeaveRequest)
  .get(protect, getMyLeaveRequests);

router.get("/all", protect, admin, getAllLeaveRequests);
router.get("/team", protect, getTeamLeaveRequests);

router.get("/:id", protect, getLeaveRequestById);
router.put("/:id", protect, updateLeaveRequest);
router.put("/:id/cancel", protect, cancelLeaveRequest);
router.put("/:id/confirm", protect, admin, confirmLeaveRequest);

module.exports = router;
