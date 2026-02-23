// ============================================
// Seed Script - Create Admin User & Default Data
// Run: node scripts/seed.js
// ============================================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");

// Import models with associations
const {
  User,
  LeaveBalance,
  LeaveType,
  Department,
  Faculty,
} = require("../models");

const seedData = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL");

    // Sync all tables (create if not exists)
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced");

    // --- Seed Faculties ---
    const faculties = [
      { name: "คณะครุศาสตร์", code: "EDU", type: "faculty" },
      { name: "คณะมนุษยศาสตร์และสังคมศาสตร์", code: "HUM", type: "faculty" },
      { name: "คณะวิทยาศาสตร์", code: "SCI", type: "faculty" },
      { name: "คณะวิทยาการจัดการ", code: "MNG", type: "faculty" },
      { name: "สำนักงานอธิการบดี", code: "ADMIN", type: "office" },
    ];

    for (const f of faculties) {
      await Faculty.findOrCreate({ where: { code: f.code }, defaults: f });
    }
    console.log("✅ Faculties seeded");

    // --- Seed Departments ---
    const adminFaculty = await Faculty.findOne({ where: { code: "ADMIN" } });
    const eduFaculty = await Faculty.findOne({ where: { code: "EDU" } });
    const humFaculty = await Faculty.findOne({ where: { code: "HUM" } });
    const sciFaculty = await Faculty.findOne({ where: { code: "SCI" } });
    const mngFaculty = await Faculty.findOne({ where: { code: "MNG" } });

    const departments = [
      // สำนักงานอธิการบดี
      { name: "สำนักงานอธิการบดี", code: "ADMIN", facultyId: adminFaculty.id },

      // คณะครุศาสตร์
      { name: "สาขาวิชาการศึกษาปฐมวัย", code: "EDU-ECE", facultyId: eduFaculty.id },
      { name: "สาขาวิชาคณิตศาสตร์", code: "EDU-MATH", facultyId: eduFaculty.id },
      { name: "สาขาวิชาภาษาอังกฤษ", code: "EDU-ENG", facultyId: eduFaculty.id },
      { name: "สาขาวิชาภาษาไทย", code: "EDU-TH", facultyId: eduFaculty.id },
      { name: "สาขาวิชาวิทยาศาสตร์ทั่วไป", code: "EDU-SCI", facultyId: eduFaculty.id },
      { name: "สาขาวิชาสังคมศึกษา", code: "EDU-SOC", facultyId: eduFaculty.id },
      { name: "สาขาวิชาพลศึกษา", code: "EDU-PE", facultyId: eduFaculty.id },
      { name: "สาขาวิชาคอมพิวเตอร์ศึกษา", code: "EDU-COM", facultyId: eduFaculty.id },

      // คณะมนุษยศาสตร์และสังคมศาสตร์
      { name: "สาขาวิชาภาษาอังกฤษ", code: "HUM-ENG", facultyId: humFaculty.id },
      { name: "สาขาวิชาภาษาไทย", code: "HUM-TH", facultyId: humFaculty.id },
      { name: "สาขาวิชารัฐประศาสนศาสตร์", code: "HUM-PA", facultyId: humFaculty.id },
      { name: "สาขาวิชานิติศาสตร์", code: "HUM-LAW", facultyId: humFaculty.id },
      { name: "สาขาวิชาสารสนเทศศาสตร์", code: "HUM-IS", facultyId: humFaculty.id },
      { name: "สาขาวิชาภาษาจีน", code: "HUM-CH", facultyId: humFaculty.id },
      { name: "สาขาวิชาการพัฒนาสังคม", code: "HUM-SD", facultyId: humFaculty.id },

      // คณะวิทยาศาสตร์
      { name: "สาขาวิชาวิทยาการคอมพิวเตอร์", code: "SCI-CS", facultyId: sciFaculty.id },
      { name: "สาขาวิชาเทคโนโลยีสารสนเทศ", code: "SCI-IT", facultyId: sciFaculty.id },
      { name: "สาขาวิชาคณิตศาสตร์", code: "SCI-MATH", facultyId: sciFaculty.id },
      { name: "สาขาวิชาเคมี", code: "SCI-CHEM", facultyId: sciFaculty.id },
      { name: "สาขาวิชาชีววิทยา", code: "SCI-BIO", facultyId: sciFaculty.id },
      { name: "สาขาวิชาฟิสิกส์", code: "SCI-PHY", facultyId: sciFaculty.id },
      { name: "สาขาวิชาวิทยาศาสตร์สิ่งแวดล้อม", code: "SCI-ENV", facultyId: sciFaculty.id },
      { name: "สาขาวิชาวิทยาศาสตร์การอาหาร", code: "SCI-FOOD", facultyId: sciFaculty.id },

      // คณะวิทยาการจัดการ
      { name: "สาขาวิชาการบัญชี", code: "MNG-ACC", facultyId: mngFaculty.id },
      { name: "สาขาวิชาการจัดการ", code: "MNG-MGT", facultyId: mngFaculty.id },
      { name: "สาขาวิชาการตลาด", code: "MNG-MKT", facultyId: mngFaculty.id },
      { name: "สาขาวิชาคอมพิวเตอร์ธุรกิจ", code: "MNG-BC", facultyId: mngFaculty.id },
      { name: "สาขาวิชาการจัดการทรัพยากรมนุษย์", code: "MNG-HR", facultyId: mngFaculty.id },
      { name: "สาขาวิชาการท่องเที่ยวและการโรงแรม", code: "MNG-THM", facultyId: mngFaculty.id },
      { name: "สาขาวิชานิเทศศาสตร์", code: "MNG-COM", facultyId: mngFaculty.id },
    ];

    for (const d of departments) {
      await Department.findOrCreate({ where: { code: d.code }, defaults: d });
    }
    console.log("✅ Departments seeded");

    // --- Seed Leave Types ---
    const leaveTypes = [
      {
        name: "ลาป่วย",
        code: "sick",
        description: "ลาป่วยเนื่องจากเจ็บป่วย",
        defaultDays: 60,
        requiresMedicalCert: true,
      },
      {
        name: "ลากิจส่วนตัว",
        code: "personal",
        description: "ลากิจส่วนตัว",
        defaultDays: 45,
        requiresMedicalCert: false,
      },
      {
        name: "ลาพักผ่อน",
        code: "vacation",
        description: "ลาพักผ่อนประจำปี",
        defaultDays: 10,
        requiresMedicalCert: false,
      },
      {
        name: "ลาคลอดบุตร",
        code: "maternity",
        description: "ลาคลอดบุตรสำหรับพนักงานหญิง",
        defaultDays: 90,
        requiresMedicalCert: false,
      },
      {
        name: "ลาช่วยภรรยาคลอด",
        code: "paternity",
        description: "ลาช่วยภรรยาคลอดสำหรับพนักงานชาย",
        defaultDays: 15,
        requiresMedicalCert: false,
      },
      {
        name: "ลาเลี้ยงดูบุตร",
        code: "childcare",
        description: "ลาเลี้ยงดูบุตร",
        defaultDays: 150,
        requiresMedicalCert: false,
      },
      {
        name: "ลาอุปสมบท/ฮัจย์",
        code: "ordination",
        description: "ลาอุปสมบทหรือประกอบพิธีฮัจย์",
        defaultDays: 120,
        requiresMedicalCert: false,
      },
      {
        name: "ลาตรวจเลือก",
        code: "military",
        description: "ลาตรวจเลือกเข้ารับราชการทหาร",
        defaultDays: 60,
        requiresMedicalCert: false,
      },
    ];

    for (const lt of leaveTypes) {
      await LeaveType.findOrCreate({ where: { code: lt.code }, defaults: lt });
    }
    console.log("✅ Leave Types seeded");

    // --- Seed Admin User ---
    const adminDept = await Department.findOne({ where: { code: "ADMIN" } });
    const existingAdmin = await User.findOne({
      where: { email: "admin@bru.ac.th" },
    });

    if (!existingAdmin) {
      const admin = await User.create({
        employeeId: "ADMIN001",
        email: "admin@bru.ac.th",
        password: "admin123",
        firstName: "Admin",
        lastName: "System",
        departmentId: adminDept ? adminDept.id : null,
        position: "ผู้ดูแลระบบ",
        role: "admin",
      });

      // Create leave balances for admin (V2: normalized, 1 row per leave type)
      const allLeaveTypes = await LeaveType.findAll({ where: { isActive: true } });
      const currentYear = new Date().getFullYear();

      await Promise.all(
        allLeaveTypes.map((lt) =>
          LeaveBalance.findOrCreate({
            where: { userId: admin.id, leaveTypeId: lt.id, year: currentYear },
            defaults: {
              totalDays: lt.defaultDays,
              usedDays: 0,
              carriedOverDays: 0,
            },
          })
        )
      );

      console.log("✅ Admin user created");
      console.log("   📧 Email: admin@bru.ac.th");
      console.log("   🔑 Password: admin123");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    console.log("\n🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();
