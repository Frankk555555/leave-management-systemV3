import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { leaveRequestsAPI, holidaysAPI } from "../services/api";
import {
  FaBriefcaseMedical,
  FaClipboardList,
  FaUmbrellaBeach,
  FaBaby,
  FaBabyCarriage,
  FaChild,
  FaPray,
  FaMedal,
  FaFileAlt,
  FaBirthdayCake,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import "react-calendar/dist/Calendar.css";
import "./TeamCalendar.css";

const TeamCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamRes, holidaysRes] = await Promise.all([
        leaveRequestsAPI.getTeam(),
        holidaysAPI.getAll(new Date().getFullYear()),
      ]);
      setTeamLeaves(teamRes.data);
      setHolidays(holidaysRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isHoliday = (date) => {
    return holidays.some((h) => {
      const holidayDate = new Date(h.date);
      return holidayDate.toDateString() === date.toDateString();
    });
  };

  const getTeamLeavesForDate = (date) => {
    return teamLeaves.filter((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const classes = [];
    if (isHoliday(date)) classes.push("holiday-tile");
    if (getTeamLeavesForDate(date).length > 0) classes.push("team-leave-tile");
    return classes.join(" ");
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const leaves = getTeamLeavesForDate(date);
    if (leaves.length > 0) {
      return (
        <div className="tile-badge">
          <span>{leaves.length}</span>
        </div>
      );
    }
    return null;
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      sick: <FaBriefcaseMedical className="icon-sick" />,
      personal: <FaClipboardList className="icon-personal" />,
      vacation: <FaUmbrellaBeach className="icon-vacation" />,
      maternity: <FaBaby className="icon-maternity" />,
      paternity: <FaBabyCarriage className="icon-paternity" />,
      childcare: <FaChild className="icon-childcare" />,
      ordination: <FaPray className="icon-ordination" />,
      military: <FaMedal className="icon-military" />,
    };
    return icons[type] || <FaFileAlt />;
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
      military: "ลาตรวจเลือก/เตรียมพล",
    };
    return types[type] || type;
  };

  const selectedDateLeaves = getTeamLeavesForDate(date);
  const selectedHoliday = holidays.find((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate.toDateString() === date.toDateString();
  });

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
      <div className="team-calendar-page">
        <div className="page-header">
          <h1>👥 ปฏิทินวันลาทีม</h1>
          <p>ดูวันลาของเพื่อนร่วมงานในทีม</p>
        </div>

        <div className="calendar-container">
          <div className="calendar-wrapper">
            <Calendar
              onChange={setDate}
              value={date}
              locale="th-TH"
              tileClassName={tileClassName}
              tileContent={tileContent}
            />
          </div>

          <div className="calendar-sidebar">
            <div className="selected-date-card">
              <h3>
                {date.toLocaleDateString("th-TH", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              {selectedHoliday && (
                <div className="event-item holiday-event">
                  <span className="event-icon">
                    <FaBirthdayCake />
                  </span>
                  <div className="event-info">
                    <h4>{selectedHoliday.name}</h4>
                    <p>วันหยุดราชการ</p>
                  </div>
                </div>
              )}

              {selectedDateLeaves.length > 0 ? (
                <div className="team-leaves-list">
                  <h4>
                    👥 เพื่อนร่วมงานลาวันนี้ (
                    {
                      Object.values(
                        selectedDateLeaves.reduce((acc, leave) => {
                          const userId =
                            leave.userId ||
                            leave.user?.id ||
                            leave.employee?._id;
                          if (!acc[userId]) acc[userId] = [];
                          acc[userId].push(leave);
                          return acc;
                        }, {})
                      ).length
                    }{" "}
                    คน)
                  </h4>
                  {Object.values(
                    selectedDateLeaves.reduce((acc, leave) => {
                      const userId =
                        leave.userId || leave.user?.id || leave.employee?._id;
                      if (!acc[userId]) {
                        acc[userId] = {
                          user: leave.user || leave.employee,
                          leaves: [],
                        };
                      }
                      acc[userId].leaves.push(leave);
                      return acc;
                    }, {})
                  ).map(({ user, leaves }) => (
                    <div
                      key={user?.id || user?._id || Math.random()}
                      className="team-member-leave"
                    >
                      <div className="member-avatar">
                        {user?.firstName?.charAt(0)}
                      </div>
                      <div className="member-info">
                        <span className="member-name">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <div className="leave-types-list">
                          {leaves.map((leave, index) => (
                            <span
                              key={index}
                              className="leave-type-badge"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                marginRight: "8px",
                                marginTop: "4px",
                                fontSize: "0.85rem",
                                color: "#666",
                              }}
                            >
                              {getLeaveTypeIcon(leave.leaveType)}{" "}
                              <span style={{ marginLeft: "4px" }}>
                                {getLeaveTypeName(leave.leaveType)}
                                {(leave.timeSlot === "morning" ||
                                  leave.timeSlot === "afternoon") && (
                                  <span
                                    style={{
                                      marginLeft: "4px",
                                      fontWeight: "bold",
                                      fontSize: "0.8em",
                                    }}
                                  >
                                    (
                                    {leave.timeSlot === "morning"
                                      ? "เช้า"
                                      : "บ่าย"}
                                    )
                                  </span>
                                )}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !selectedHoliday && (
                  <p className="no-events">ไม่มีเพื่อนร่วมงานลาวันนี้</p>
                )
              )}
            </div>

            <div className="legend-card">
              <h3>สัญลักษณ์</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-dot holiday"></span>
                  <span>วันหยุดราชการ</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot team-leave"></span>
                  <span>มีเพื่อนร่วมงานลา</span>
                </div>
              </div>
            </div>

            <div className="upcoming-leaves-card">
              <h3>📋 การลาที่กำลังจะมาถึง</h3>
              <div className="upcoming-list">
                {teamLeaves
                  .filter((l) => new Date(l.startDate) >= new Date())
                  .slice(0, 5)
                  .map((leave) => (
                    <div key={leave.id || leave._id} className="upcoming-item">
                      <div className="upcoming-date">
                        {new Date(leave.startDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="upcoming-info">
                        <span className="upcoming-name">
                          {leave.user?.firstName || leave.employee?.firstName}{" "}
                          {leave.user?.lastName || leave.employee?.lastName}
                        </span>
                        <span className="upcoming-type">
                          {getLeaveTypeName(leave.leaveType)} ({leave.totalDays}{" "}
                          วัน)
                        </span>
                      </div>
                    </div>
                  ))}
                {teamLeaves.filter((l) => new Date(l.startDate) >= new Date())
                  .length === 0 && (
                  <p className="no-upcoming">ไม่มีการลาในช่วงนี้</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamCalendar;
