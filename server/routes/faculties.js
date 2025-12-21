// ============================================
// Faculty Routes (คณะ/สำนัก/สถาบัน)
// ============================================

const express = require("express");
const router = express.Router();
const { Faculty, Department } = require("../models");
const { protect, admin } = require("../middleware/auth");

// Get all faculties (for dropdown)
router.get("/", protect, async (req, res) => {
  try {
    const faculties = await Faculty.findAll({
      order: [["name", "ASC"]],
      include: [
        {
          model: Department,
          as: "departments",
          attributes: ["id", "name", "code"],
        },
      ],
    });
    res.json(faculties);
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคณะ" });
  }
});

// Create faculty (Admin only)
router.post("/", protect, admin, async (req, res) => {
  try {
    const { name, code, type } = req.body;
    const faculty = await Faculty.create({ name, code, type });
    res.status(201).json(faculty);
  } catch (error) {
    console.error("Error creating faculty:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคณะ" });
  }
});

// Initialize default faculties (Admin only)
router.post("/initialize", protect, admin, async (req, res) => {
  try {
    const defaultFaculties = [
      { name: "คณะวิทยาศาสตร์", code: "SCI", type: "faculty" },
      { name: "คณะวิศวกรรมศาสตร์", code: "ENG", type: "faculty" },
      { name: "คณะครุศาสตร์", code: "EDU", type: "faculty" },
      { name: "คณะมนุษยศาสตร์และสังคมศาสตร์", code: "HUSO", type: "faculty" },
      { name: "คณะเทคโนโลยีอุตสาหกรรม", code: "TECH", type: "faculty" },
      { name: "คณะวิทยาการจัดการ", code: "MGT", type: "faculty" },
      { name: "สำนักงานอธิการบดี", code: "PRES", type: "office" },
      {
        name: "สำนักวิทยบริการและเทคโนโลยีสารสนเทศ",
        code: "ARIT",
        type: "office",
      },
    ];

    for (const fac of defaultFaculties) {
      await Faculty.findOrCreate({
        where: { code: fac.code },
        defaults: fac,
      });
    }

    const faculties = await Faculty.findAll({ order: [["name", "ASC"]] });
    res.json({ message: "เพิ่มคณะเริ่มต้นเรียบร้อยแล้ว", faculties });
  } catch (error) {
    console.error("Error initializing faculties:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// Update faculty (Admin only)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type } = req.body;
    const faculty = await Faculty.findByPk(id);
    if (!faculty) {
      return res.status(404).json({ message: "ไม่พบคณะ" });
    }
    await faculty.update({ name, code, type });
    res.json(faculty);
  } catch (error) {
    console.error("Error updating faculty:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตคณะ" });
  }
});

// Delete faculty (Admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findByPk(id);
    if (!faculty) {
      return res.status(404).json({ message: "ไม่พบคณะ" });
    }
    await faculty.destroy();
    res.json({ message: "ลบคณะเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error deleting faculty:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบคณะ" });
  }
});

module.exports = router;
