const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Get list of all form files
router.get("/", async (req, res) => {
  try {
    const formsDir = path.join(__dirname, "../../แบบฟอร์มการลา");

    // Check if directory exists
    if (!fs.existsSync(formsDir)) {
      return res.status(404).json({ message: "ไม่พบโฟลเดอร์แบบฟอร์ม" });
    }

    const files = fs.readdirSync(formsDir);

    // Filter only PDF files and create file info
    const formFiles = files
      .filter((file) => file.toLowerCase().endsWith(".pdf"))
      .map((file) => {
        const filePath = path.join(formsDir, file);
        const stats = fs.statSync(filePath);

        // Generate a cleaner display name
        let displayName = file.replace(".pdf", "").replace("แบบฟอร์ม", "");
        if (displayName.startsWith("ใบลา")) {
          displayName = displayName;
        } else if (displayName.startsWith("ขอ")) {
          displayName = displayName.substring(2);
        }

        return {
          filename: file,
          displayName: displayName.trim() || file.replace(".pdf", ""),
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          downloadUrl: `/api/forms/download/${encodeURIComponent(file)}`,
        };
      });

    res.json(formFiles);
  } catch (error) {
    console.error("Error listing forms:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดรายการฟอร์ม" });
  }
});

// Download form file
router.get("/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const formsDir = path.join(__dirname, "../../แบบฟอร์มการลา");
    const filePath = path.join(formsDir, decodeURIComponent(filename));

    // Security check: ensure the file is within the forms directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(formsDir)) {
      return res.status(403).json({ message: "ไม่อนุญาตให้เข้าถึงไฟล์นี้" });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "ไม่พบไฟล์ที่ต้องการ" });
    }

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error downloading form:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดาวน์โหลดฟอร์ม" });
  }
});

// Preview form file (open in browser)
router.get("/preview/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const formsDir = path.join(__dirname, "../../แบบฟอร์มการลา");
    const filePath = path.join(formsDir, decodeURIComponent(filename));

    // Security check: ensure the file is within the forms directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(formsDir)) {
      return res.status(403).json({ message: "ไม่อนุญาตให้เข้าถึงไฟล์นี้" });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "ไม่พบไฟล์ที่ต้องการ" });
    }

    // Set headers for inline viewing (preview)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error previewing form:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดูตัวอย่างฟอร์ม" });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

module.exports = router;
