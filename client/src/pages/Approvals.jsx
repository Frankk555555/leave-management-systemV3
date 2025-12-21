import React, { useState, useEffect } from "react";
import { leaveRequestsAPI } from "../services/api";
import { useToast } from "../components/common/Toast";
import Navbar from "../components/common/Navbar";
import "./Approvals.css";

// React Icons
import {
  FaHospital,
  FaClipboardList,
  FaUmbrellaBeach,
  FaFileAlt,
  FaCheckCircle,
  FaBaby,
  FaUserFriends,
  FaChild,
  FaPray,
  FaMedal,
  FaPaperclip,
  FaTimesCircle,
} from "react-icons/fa";

const Approvals = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [noteModal, setNoteModal] = useState({
    open: false,
    requestId: null,
    action: null,
  });
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await leaveRequestsAPI.getPending();
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (requestId, action) => {
    setNoteModal({ open: true, requestId, action });
    setNote("");
  };

  const confirmAction = async () => {
    setProcessing(noteModal.requestId);
    try {
      if (noteModal.action === "approve") {
        await leaveRequestsAPI.approve(noteModal.requestId, note);
        toast.success("อนุมัติคำขอลาเรียบร้อยแล้ว");
      } else {
        await leaveRequestsAPI.reject(noteModal.requestId, note);
        toast.success("ปฏิเสธคำขอลาเรียบร้อยแล้ว");
      }
      setRequests((prev) =>
        prev.filter((r) => (r.id || r._id) !== noteModal.requestId)
      );
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
      setNoteModal({ open: false, requestId: null, action: null });
    }
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

  // เปิดไฟล์แนบในหน้าต่างใหม่
  const handlePreview = (fileUrl) => {
    let normalizedPath = fileUrl.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }
    window.open(`http://localhost:5000${normalizedPath}`, "_blank");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="approvals-page">
        <div className="page-header">
          <h1>
            <FaCheckCircle style={{ marginRight: "0.5rem" }} /> อนุมัติการลา
          </h1>
          <p>รายการคำขอลาที่รอการอนุมัติ ({requests.length} รายการ)</p>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <h3>ไม่มีคำขอที่รอการอนุมัติ</h3>
            <p>คำขอลาทั้งหมดได้รับการดำเนินการแล้ว</p>
          </div>
        ) : (
          <div className="approvals-grid">
            {requests.map((request) => (
              <div key={request.id || request._id} className="approval-card">
                <div className="card-header">
                  <div className="employee-info">
                    <div className="avatar">
                      {request.employee?.firstName?.charAt(0)}
                    </div>
                    <div>
                      <h4>
                        {request.employee?.firstName}{" "}
                        {request.employee?.lastName}
                      </h4>
                      <p>
                        {request.employee?.department} -{" "}
                        {request.employee?.position}
                      </p>
                    </div>
                  </div>
                  <div className="leave-type-badge">
                    {getLeaveTypeIcon(request.leaveType)}{" "}
                    {getLeaveTypeName(request.leaveType)}
                  </div>
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
                      </span>
                    </div>
                    <div className="days-count">
                      <span className="days-number">{request.totalDays}</span>
                      <span className="days-label">วัน</span>
                      {(request.timeSlot === "morning" ||
                        request.timeSlot === "afternoon") && (
                        <span className="time-slot-badge">
                          ({request.timeSlot === "morning" ? "เช้า" : "บ่าย"})
                        </span>
                      )}
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

                <div className="card-actions">
                  <button
                    className="reject-btn"
                    onClick={() =>
                      handleAction(request.id || request._id, "reject")
                    }
                    disabled={processing === (request.id || request._id)}
                  >
                    <FaTimesCircle /> ไม่อนุมัติ
                  </button>
                  <button
                    className="approve-btn"
                    onClick={() =>
                      handleAction(request.id || request._id, "approve")
                    }
                    disabled={processing === (request.id || request._id)}
                  >
                    <FaCheckCircle /> อนุมัติ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {noteModal.open && (
          <div
            className="modal-overlay"
            onClick={() =>
              setNoteModal({ open: false, requestId: null, action: null })
            }
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>
                {noteModal.action === "approve"
                  ? "✅ ยืนยันการอนุมัติ"
                  : "❌ ยืนยันการปฏิเสธ"}
              </h3>
              <div className="form-group">
                <label>หมายเหตุ (ถ้ามี)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ระบุหมายเหตุ..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() =>
                    setNoteModal({ open: false, requestId: null, action: null })
                  }
                >
                  ยกเลิก
                </button>
                <button
                  className={
                    noteModal.action === "approve"
                      ? "approve-btn"
                      : "reject-btn"
                  }
                  onClick={confirmAction}
                  disabled={processing}
                >
                  {processing ? "กำลังดำเนินการ..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Approvals;
