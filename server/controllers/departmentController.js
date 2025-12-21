// ============================================
// Department Controller
// ============================================

const Department = require("../models/Department");

// Get all departments
exports.getAll = async (req, res) => {
  try {
    const departments = await Department.findAll({
      order: [["name", "ASC"]],
    });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลแผนก" });
  }
};

// Create department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    const department = await Department.create({ name, code });
    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างแผนก" });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
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
};

// Delete department
exports.deleteDepartment = async (req, res) => {
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
};

// Initialize default departments
exports.initialize = async (req, res) => {
  try {
    const defaultDepartments = [
      { name: "สาขาวิชาวิทยาการคอมพิวเตอร์", code: "CS" },
      { name: "สาขาวิชาเทคโนโลยีสารสนเทศ", code: "IT" },
      { name: "สาขาวิชาคณิตศาสตร์", code: "MATH" },
      { name: "สาขาวิชาฟิสิกส์", code: "PHYS" },
      { name: "สาขาวิชาเคมี", code: "CHEM" },
      { name: "สาขาวิชาชีววิทยา", code: "BIO" },
      { name: "สำนักงานคณะ", code: "OFFICE" },
    ];

    for (const dept of defaultDepartments) {
      await Department.findOrCreate({
        where: { code: dept.code },
        defaults: dept,
      });
    }

    const departments = await Department.findAll({ order: [["name", "ASC"]] });
    res.json({ message: "เพิ่มแผนกเริ่มต้นเรียบร้อยแล้ว", departments });
  } catch (error) {
    console.error("Error initializing departments:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};
