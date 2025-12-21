import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { leaveRequestsAPI } from "../services/api";
import Navbar from "../components/common/Navbar";
import "./Dashboard.css";
import React from "react";

// React Icons
import {
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaBullseye,
  FaHospital,
  FaClipboardList,
  FaUmbrellaBeach,
  FaHandPaper,
  FaBaby,
  FaUserFriends,
  FaChild,
  FaPray,
  FaMedal,
} from "react-icons/fa";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await leaveRequestsAPI.getMyRequests();
      const requests = response.data;

      setStats({
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
        total: requests.length,
      });

      setRecentRequests(requests.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
      default:
        return <FaClipboardList />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "#fef3c7", color: "#d97706", text: "รออนุมัติ" },
      approved: { bg: "#d1fae5", color: "#059669", text: "อนุมัติแล้ว" },
      rejected: { bg: "#fee2e2", color: "#dc2626", text: "ไม่อนุมัติ" },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          padding: "0.25rem 0.75rem",
          borderRadius: "20px",
          fontSize: "0.8rem",
          fontWeight: 500,
        }}
      >
        {style.text}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>
            สวัสดี, คุณ {user?.firstName} {user?.lastName}{" "}
            <FaHandPaper style={{ marginLeft: "0.3rem", color: "#e6c314ff" }} />
          </h1>
          <p>ยินดีต้อนรับเข้าสู่ระบบบริหารการลา</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              <FaChartBar color="white" />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>คำขอทั้งหมด</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #f6d365, #fda085)",
              }}
            >
              <FaClock color="white" />
            </div>
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>รออนุมัติ</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #11998e, #38ef7d)",
              }}
            >
              <FaCheckCircle color="white" />
            </div>
            <div className="stat-info">
              <h3>{stats.approved}</h3>
              <p>อนุมัติแล้ว</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ee5a5a)",
              }}
            >
              <FaTimesCircle color="white" />
            </div>
            <div className="stat-info">
              <h3>{stats.rejected}</h3>
              <p>ไม่อนุมัติ</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="leave-balance-card">
            <h2>
              <FaBullseye style={{ marginRight: "0.5rem" }} /> ยอดวันลาคงเหลือ
            </h2>
            <div className="balance-grid">
              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #059669, #10b981)",
                  }}
                >
                  <FaHospital color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาป่วย</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.sick || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.sick || 0) / 60) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #059669, #10b981)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  <FaClipboardList color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลากิจส่วนตัว</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.personal || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.personal || 0) / 45) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  }}
                >
                  <FaUmbrellaBeach color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาพักผ่อน</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.vacation || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.vacation || 0) / 10) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #ec4899, #f472b6)",
                  }}
                >
                  <FaBaby color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาคลอดบุตร</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.maternity || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.maternity || 0) / 90) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #ec4899, #f472b6)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #0891b2, #22d3ee)",
                  }}
                >
                  <FaUserFriends color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาช่วยภรรยาคลอด</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.paternity || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.paternity || 0) / 15) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #0891b2, #22d3ee)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #14b8a6, #5eead4)",
                  }}
                >
                  <FaChild color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาเลี้ยงดูบุตร</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.childcare || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.childcare || 0) / 150) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #14b8a6, #5eead4)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #ea580c, #fb923c)",
                  }}
                >
                  <FaPray color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาอุปสมบท/ฮัจย์</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.ordination || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: `${Math.min(
                        ((user?.leaveBalance?.ordination || 0) / 120) * 100,
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #ea580c, #fb923c)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="balance-item">
                <div
                  className="balance-icon"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                  }}
                >
                  <FaMedal color="white" />
                </div>
                <div className="balance-info">
                  <h4>ลาตรวจเลือก</h4>
                  <p>
                    <span className="balance-number">
                      {user?.leaveBalance?.military || 0}
                    </span>{" "}
                    วัน
                  </p>
                </div>
                <div className="balance-bar">
                  <div
                    className="balance-progress"
                    style={{
                      width: "100%",
                      background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="recent-requests-card">
            <h2>
              <FaClipboardList style={{ marginRight: "0.5rem" }} /> คำขอล่าสุด
            </h2>
            {recentRequests.length === 0 ? (
              <p className="no-data">ยังไม่มีคำขอลา</p>
            ) : (
              <div className="requests-list">
                {recentRequests.map((request) => (
                  <div key={request.id || request._id} className="request-item">
                    <div className="request-type">
                      {getLeaveTypeIcon(request.leaveType)}
                    </div>
                    <div className="request-info">
                      <h4>{getLeaveTypeName(request.leaveType)}</h4>
                      <p>
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </p>
                    </div>
                    <div className="request-days">{request.totalDays} วัน</div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
