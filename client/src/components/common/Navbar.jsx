import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

// React Icons
import {
  FaGraduationCap,
  FaChartBar,
  FaEdit,
  FaClipboardList,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaCog,
  FaFileAlt,
  FaUsersCog,
  FaCalendarCheck,
  FaSignOutAlt,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout, isAdmin, isSupervisor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>
          <FaGraduationCap style={{ marginRight: "0.5rem" }} /> ระบบบริหารการลา
        </h1>
      </div>

      <div className="navbar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <FaChartBar style={{ marginRight: "0.3rem" }} /> แดชบอร์ด
        </NavLink>
        <NavLink
          to="/leave-request"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <FaEdit style={{ marginRight: "0.3rem" }} /> ขอลา
        </NavLink>
        <NavLink
          to="/leave-history"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <FaClipboardList style={{ marginRight: "0.3rem" }} /> ประวัติการลา
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <FaCalendarAlt style={{ marginRight: "0.3rem" }} /> ปฏิทิน
        </NavLink>
        <NavLink
          to="/team-calendar"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <FaUsers style={{ marginRight: "0.3rem" }} /> วันลาทีม
        </NavLink>

        {isSupervisor && (
          <NavLink
            to="/approvals"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FaCheckCircle style={{ marginRight: "0.3rem" }} /> อนุมัติลา
          </NavLink>
        )}

        {isAdmin && (
          <div className="nav-dropdown">
            <span className="nav-link dropdown-toggle">
              <FaCog style={{ marginRight: "0.3rem" }} /> จัดการระบบ
            </span>
            <div className="dropdown-menu">
              <NavLink to="/reports" className="dropdown-item">
                <FaChartBar style={{ marginRight: "0.3rem" }} /> รายงาน
              </NavLink>
              <NavLink to="/users" className="dropdown-item">
                <FaUsersCog style={{ marginRight: "0.3rem" }} /> จัดการบุคลากร
              </NavLink>
              <NavLink to="/leave-types" className="dropdown-item">
                <FaFileAlt style={{ marginRight: "0.3rem" }} /> ประเภทการลา
              </NavLink>
              <NavLink to="/holidays" className="dropdown-item">
                <FaCalendarCheck style={{ marginRight: "0.3rem" }} /> วันหยุด
              </NavLink>
            </div>
          </div>
        )}
      </div>

      <div className="navbar-end">
        <NotificationBell />
        <div className="user-info">
          <span className="user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="user-role">
            {user?.role === "admin"
              ? "ผู้ดูแลระบบ"
              : user?.role === "supervisor"
              ? "หัวหน้างาน"
              : "บุคลากร"}
          </span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt style={{ marginRight: "0.3rem" }} /> ออกจากระบบ
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
