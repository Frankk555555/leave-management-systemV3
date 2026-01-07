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
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaBaby,
  FaUserFriends,
  FaChild,
  FaPray,
  FaMedal,
  FaPaperclip,
  FaFilePdf,
  FaEdit,
  FaTimes,
} from "react-icons/fa";

const LeaveHistory = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editModal, setEditModal] = useState({ open: false, request: null });
  const [editForm, setEditForm] = useState({
    leaveType: "sick",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [processing, setProcessing] = useState(false);

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

  const handleCancel = async (id) => {
    const confirmed = await toast.confirm("คุณต้องการยกเลิกคำขอลานี้หรือไม่?");
    if (!confirmed) return;
    try {
      await leaveRequestsAPI.cancel(id);
      setRequests((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id ? { ...r, status: "cancelled" } : r
        )
      );
      toast.success("ยกเลิกคำขอลาเรียบร้อยแล้ว");
    } catch (error) {
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const openEditModal = (request) => {
    setEditForm({
      leaveType: request.leaveType,
      startDate: new Date(request.startDate).toISOString().split("T")[0],
      endDate: new Date(request.endDate).toISOString().split("T")[0],
      reason: request.reason,
    });
    setEditModal({ open: true, request });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await leaveRequestsAPI.update(
        editModal.request.id || editModal.request._id,
        editForm
      );
      fetchRequests();
      setEditModal({ open: false, request: null });
      toast.success("อัปเดตคำขอลาเรียบร้อยแล้ว");
    } catch (error) {
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        bg: "linear-gradient(135deg, #fef3c7, #fde68a)",
        color: "#d97706",
        text: "รออนุมัติ",
        icon: <FaClock />,
      },
      approved: {
        bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
        color: "#059669",
        text: "อนุมัติแล้ว",
        icon: <FaCheckCircle />,
      },
      rejected: {
        bg: "linear-gradient(135deg, #fee2e2, #fecaca)",
        color: "#dc2626",
        text: "ไม่อนุมัติ",
        icon: <FaTimesCircle />,
      },
      cancelled: {
        bg: "linear-gradient(135deg, #e2e8f0, #cbd5e0)",
        color: "#718096",
        text: "ยกเลิกแล้ว",
        icon: <FaBan />,
      },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        className="status-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {style.icon} {style.text}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

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
            <p>รายการคำขอลาทั้งหมดของคุณ</p>
          </div>
          <div className="filter-tabs">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              ทั้งหมด ({requests.length})
            </button>
            <button
              className={filter === "pending" ? "active" : ""}
              onClick={() => setFilter("pending")}
            >
              รออนุมัติ ({requests.filter((r) => r.status === "pending").length}
              )
            </button>
            <button
              className={filter === "approved" ? "active" : ""}
              onClick={() => setFilter("approved")}
            >
              อนุมัติแล้ว (
              {requests.filter((r) => r.status === "approved").length})
            </button>
            <button
              className={filter === "rejected" ? "active" : ""}
              onClick={() => setFilter("rejected")}
            >
              ไม่อนุมัติ (
              {requests.filter((r) => r.status === "rejected").length})
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>ไม่มีข้อมูลการลา</h3>
            <p>ยังไม่มีคำขอลาในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="history-grid">
            {filteredRequests.map((request) => (
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
                  {getStatusBadge(request.status)}
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

                  <div className="days-badge">{request.totalDays} วัน</div>

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

                  {request.approvalNote && (
                    <div className="approval-note">
                      <span className="note-label">หมายเหตุผู้อนุมัติ:</span>
                      <p className="note-text">{request.approvalNote}</p>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="footer-row">
                    <span className="created-date">
                      ยื่นเมื่อ {formatDate(request.createdAt)}
                    </span>
                    <div className="footer-right">
                      <button
                        className="pdf-btn-leave"
                        onClick={() => handleDownloadPDF(request)}
                        title="ดาวน์โหลดใบลา PDF"
                      >
                        <FaFilePdf /> ใบลา
                      </button>
                      {request.approver && (
                        <span className="approver">
                          โดย {request.approver.firstName}{" "}
                          {request.approver.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  {request.status === "pending" && (
                    <div className="action-row">
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(request)}
                      >
                        <FaEdit /> แก้ไข
                      </button>
                      <button
                        className="cancel-btn-leave"
                        onClick={() => handleCancel(request.id || request._id)}
                      >
                        <FaTimes /> ยกเลิก
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editModal.open && (
          <div
            className="modal-overlay"
            onClick={() => setEditModal({ open: false, request: null })}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>✏️ แก้ไขคำขอลา</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>ประเภทการลา</label>
                  <select
                    value={editForm.leaveType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, leaveType: e.target.value })
                    }
                  >
                    <option value="sick">
                      ลาป่วย ({user?.leaveBalance?.sick || 0} วัน)
                    </option>
                    <option value="personal">
                      ลากิจส่วนตัว ({user?.leaveBalance?.personal || 0} วัน)
                    </option>
                    <option value="vacation">
                      ลาพักผ่อน ({user?.leaveBalance?.vacation || 0} วัน)
                    </option>
                    <option value="maternity">
                      ลาคลอดบุตร ({user?.leaveBalance?.maternity || 0} วัน)
                    </option>
                    <option value="paternity">
                      ลาช่วยภรรยาคลอด ({user?.leaveBalance?.paternity || 0} วัน)
                    </option>
                    <option value="childcare">
                      ลาเลี้ยงดูบุตร ({user?.leaveBalance?.childcare || 0} วัน)
                    </option>
                    <option value="ordination">
                      ลาอุปสมบท/ฮัจย์ ({user?.leaveBalance?.ordination || 0}{" "}
                      วัน)
                    </option>
                    <option value="military">
                      ลาตรวจเลือก ({user?.leaveBalance?.military || 0} วัน)
                    </option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>วันที่เริ่มต้น</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>วันที่สิ้นสุด</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endDate: e.target.value })
                      }
                      min={editForm.startDate}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>เหตุผล</label>
                  <textarea
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reason: e.target.value })
                    }
                    rows={3}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setEditModal({ open: false, request: null })}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={processing}
                  >
                    {processing ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LeaveHistory;
