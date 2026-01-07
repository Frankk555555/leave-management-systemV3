import React, { useState, useEffect } from "react";
import { leaveRequestsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import Navbar from "../components/common/Navbar";
import Loading from "../components/common/Loading";
import generateLeavePDF from "../utils/generateLeavePDF";
import config from "../config";
import "./LeaveHistory.css";

// React Icons
import {
  FaHospital,
  FaClipboardList,
  FaUmbrellaBeach,
  FaFileAlt,
  FaBaby,
  FaUserFriends,
  FaChild,
  FaPray,
  FaMedal,
  FaPaperclip,
  FaFilePdf,
} from "react-icons/fa";

const LeaveHistory = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  // ดาวน์โหลดใบลา PDF
  const handleDownloadPDF = async (request) => {
    const leaveData = {
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
      totalDays: request.totalDays,
    };
    await generateLeavePDF(leaveData, user);
  };

  const fetchRequests = async () => {
    try {
      const response = await leaveRequestsAPI.getMyRequests();
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // เปิดไฟล์แนบในหน้าต่างใหม่
  const handlePreview = (fileUrl) => {
    // Normalize path - handle both old format (uploads\\file.pdf) and new format (/uploads/file.pdf)
    let normalizedPath = fileUrl.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }
    window.open(`${config.API_URL}${normalizedPath}`, "_blank");
  };

  const getLeaveTypeName = (type) => {
    const types = {
      sick: "ลาป่วย",
      personal: "ลากิจส่วนตัว",
      vacation: "ลาพักผ่อน",
      maternity: "ลาคลอดบุตร",
      paternity: "ลาช่วยภรรยาคลอด",
      childcare: "ลาเลี้ยงดูบุตร",
      ordination: "ลาอุปสมบท/ฮัจย์",
      military: "ลาตรวจเลือก",
    };
    return types[type] || type;
  };

  const getLeaveTypeIcon = (type) => {
    switch (type) {
      case "sick":
        return <FaHospital />;
      case "personal":
        return <FaClipboardList />;
      case "vacation":
        return <FaUmbrellaBeach />;
      case "maternity":
        return <FaBaby />;
      case "paternity":
        return <FaUserFriends />;
      case "childcare":
        return <FaChild />;
      case "ordination":
        return <FaPray />;
      case "military":
        return <FaMedal />;
      default:
        return <FaFileAlt />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading size="fullpage" text="กำลังโหลด..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="leave-history-page">
        <div className="page-header">
          <div>
            <h1>ประวัติการลา</h1>
            <p>รายการบันทึกการลาทั้งหมดของคุณ</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>ไม่มีข้อมูลการลา</h3>
            <p>ยังไม่มีบันทึกการลา</p>
          </div>
        ) : (
          <div className="history-grid">
            {requests.map((request) => (
              <div key={request.id || request._id} className="history-card">
                <div className="card-header">
                  <div className="leave-type-info">
                    <span className="type-icon">
                      {getLeaveTypeIcon(request.leaveType)}
                    </span>
                    <span className="type-name">
                      {getLeaveTypeName(request.leaveType)}
                    </span>
                  </div>
                  <div className="days-badge">{request.totalDays} วัน</div>
                </div>

                <div className="card-body">
                  <div className="date-range-display">
                    <div className="date-item">
                      <span className="date-label">เริ่มต้น</span>
                      <span className="date-value">
                        {formatDate(request.startDate)}
                      </span>
                    </div>
                    <div className="date-arrow">→</div>
                    <div className="date-item">
                      <span className="date-label">สิ้นสุด</span>
                      <span className="date-value">
                        {formatDate(request.endDate)}
                        {(request.timeSlot === "morning" ||
                          request.timeSlot === "afternoon") && (
                          <span className="time-slot-badge">
                            ({request.timeSlot === "morning" ? "เช้า" : "บ่าย"})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="reason-section">
                    <span className="reason-label">เหตุผล:</span>
                    <p className="reason-text">{request.reason}</p>
                  </div>

                  {request.attachments && request.attachments.length > 0 && (
                    <div className="attachments-section">
                      <span className="attachments-label">
                        <FaPaperclip /> ไฟล์แนบ ({request.attachments.length})
                      </span>
                      <div className="attachments-list">
                        {request.attachments.map((file, idx) => {
                          // Handle both Sequelize object and Mongoose string formats
                          const filePath =
                            typeof file === "string" ? file : file.filePath;
                          const fileName =
                            typeof file === "string"
                              ? file.split("/").pop()
                              : file.fileName ||
                                filePath?.split("/").pop() ||
                                "ไฟล์แนบ";

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handlePreview(filePath)}
                              className="attachment-link"
                            >
                              <FaFileAlt /> {fileName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="footer-row">
                    <span className="created-date">
                      ยื่นเมื่อ {formatDate(request.createdAt)}
                    </span>
                    <button
                      className="pdf-btn-leave"
                      onClick={() => handleDownloadPDF(request)}
                      title="ดาวน์โหลดใบลา PDF"
                    >
                      <FaFilePdf /> ใบลา
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default LeaveHistory;
