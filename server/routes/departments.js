// ============================================
// Department Routes (สาขาวิชา/หน่วยงาน)
// ============================================

const express = require("express");
const router = express.Router();
const { Department, Faculty } = require("../models");
const { protect, admin } = require("../middleware/auth");

// Get all departments (with optional facultyId filter)
router.get("/", protect, async (req, res) => {
  try {
    const { facultyId } = req.query;
    const where = {};
    if (facultyId) {
      where.facultyId = facultyId;
    }

    const departments = await Department.findAll({
      where,
      order: [["name", "ASC"]],
      include: [
        {
          model: Faculty,
          as: "faculty",
          attributes: ["id", "name", "code"],
        },
      ],
    });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสาขา" });
  }
});

// Create department (Admin only)
router.post("/", protect, admin, async (req, res) => {
  try {
    const { name, code } = req.body;
    const department = await Department.create({ name, code });
    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างแผนก" });
  }
});

// Initialize default departments (Admin only)
// ต้องเรียก /api/faculties/initialize ก่อน เพื่อให้มีคณะในระบบ
router.post("/initialize", protect, admin, async (req, res) => {
  try {
    // ดึง ID ของคณะจากฐานข้อมูล
    const scienceFaculty = await Faculty.findOne({ where: { code: "SCI" } });
    const eduFaculty = await Faculty.findOne({ where: { code: "EDU" } });
    const husoFaculty = await Faculty.findOne({ where: { code: "HUSO" } });
    const mgtFaculty = await Faculty.findOne({ where: { code: "MGT" } });
    const techFaculty = await Faculty.findOne({ where: { code: "TECH" } });
    const engFaculty = await Faculty.findOne({ where: { code: "ENG" } });
    const aritOffice = await Faculty.findOne({ where: { code: "ARIT" } });
    const presOffice = await Faculty.findOne({ where: { code: "PRES" } });

    const defaultDepartments = [
      // คณะวิทยาศาสตร์
      {
        name: "สาขาวิชาวิทยาการคอมพิวเตอร์",
        code: "CS",
        facultyId: scienceFaculty?.id,
      },
      {
        name: "สาขาวิชาเทคโนโลยีสารสนเทศ",
        code: "IT",
        facultyId: scienceFaculty?.id,
      },
      {
        name: "สาขาวิชาคณิตศาสตร์",
        code: "MATH",
        facultyId: scienceFaculty?.id,
      },
      { name: "สาขาวิชาฟิสิกส์", code: "PHYS", facultyId: scienceFaculty?.id },
      { name: "สาขาวิชาเคมี", code: "CHEM", facultyId: scienceFaculty?.id },
      { name: "สาขาวิชาชีววิทยา", code: "BIO", facultyId: scienceFaculty?.id },
      {
        name: "สาขาวิชาสถิติประยุกต์",
        code: "STAT",
        facultyId: scienceFaculty?.id,
      },
      {
        name: "สำนักงานคณะวิทยาศาสตร์",
        code: "SCI_OFFICE",
        facultyId: scienceFaculty?.id,
      },

      // คณะครุศาสตร์
      {
        name: "สาขาวิชาการศึกษาปฐมวัย",
        code: "ECE",
        facultyId: eduFaculty?.id,
      },
      {
        name: "สาขาวิชาคณิตศาสตร์ (ค.บ.)",
        code: "MATH_EDU",
        facultyId: eduFaculty?.id,
      },
      {
        name: "สาขาวิชาวิทยาศาสตร์ทั่วไป",
        code: "GSCI",
        facultyId: eduFaculty?.id,
      },
      {
        name: "สำนักงานคณะครุศาสตร์",
        code: "EDU_OFFICE",
        facultyId: eduFaculty?.id,
      },

      // คณะมนุษยศาสตร์และสังคมศาสตร์
      {
        name: "สาขาวิชาภาษาอังกฤษ",
        code: "ENG_LANG",
        facultyId: husoFaculty?.id,
      },
      { name: "สาขาวิชาภาษาไทย", code: "THAI", facultyId: husoFaculty?.id },
      {
        name: "สาขาวิชารัฐประศาสนศาสตร์",
        code: "PA",
        facultyId: husoFaculty?.id,
      },
      {
        name: "สำนักงานคณะมนุษยศาสตร์ฯ",
        code: "HUSO_OFFICE",
        facultyId: husoFaculty?.id,
      },

      // คณะวิทยาการจัดการ
      { name: "สาขาวิชาการบัญชี", code: "ACC", facultyId: mgtFaculty?.id },
      { name: "สาขาวิชาการตลาด", code: "MKT", facultyId: mgtFaculty?.id },
      {
        name: "สาขาวิชาการจัดการทั่วไป",
        code: "MGT_GEN",
        facultyId: mgtFaculty?.id,
      },
      {
        name: "สำนักงานคณะวิทยาการจัดการ",
        code: "MGT_OFFICE",
        facultyId: mgtFaculty?.id,
      },

      // สำนักงานอธิการบดี
      { name: "กองกลาง", code: "GEN_DIV", facultyId: presOffice?.id },
      { name: "กองบริหารงานบุคคล", code: "HR_DIV", facultyId: presOffice?.id },
      { name: "กองคลัง", code: "FIN_DIV", facultyId: presOffice?.id },

      // สำนักวิทยบริการฯ
      {
        name: "งานบริการคอมพิวเตอร์",
        code: "COMP_SVC",
        facultyId: aritOffice?.id,
      },
      { name: "งานห้องสมุด", code: "LIB", facultyId: aritOffice?.id },
    ];

    // ลบข้อมูลเก่าที่ไม่มี facultyId ออกก่อน
    await Department.destroy({ where: { facultyId: null } });

    for (const dept of defaultDepartments) {
      if (dept.facultyId) {
        await Department.findOrCreate({
          where: { code: dept.code },
          defaults: dept,
        });
      }
    }

    const departments = await Department.findAll({
      order: [["name", "ASC"]],
      include: [{ model: Faculty, as: "faculty", attributes: ["id", "name"] }],
    });
    res.json({
      message: "เพิ่มสาขาวิชาเริ่มต้นเรียบร้อยแล้ว",
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Error initializing departments:", error);
    res
      .status(500)
      .json({
        message: "เกิดข้อผิดพลาด กรุณาเรียก /api/faculties/initialize ก่อน",
      });
  }
});

// Update department (Admin only)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: "ไม่พบแผนก" });
    }
    await department.update({ name, code });
    res.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตแผนก" });
  }
});

// Delete department (Admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: "ไม่พบแผนก" });
    }
    await department.destroy();
    res.json({ message: "ลบแผนกเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบแผนก" });
  }
});

module.exports = router;
