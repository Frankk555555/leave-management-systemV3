import React, { useState, useEffect } from "react";
import { usersAPI, departmentsAPI, facultiesAPI } from "../services/api";
import { useToast } from "../components/common/Toast";
import Navbar from "../components/common/Navbar";
import Loading from "../components/common/Loading";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaHospital,
  FaClipboardList,
  FaUmbrellaBeach,
  FaKey,
  FaFileImport,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "./UserManagement.css";

const UserManagement = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");

  // Reset password modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    departmentId: "",
    position: "",
    role: "employee",
    supervisorId: "",
    startDate: "",
    leaveBalance: {
      sick: 60,
      personal: 45,
      vacation: 10,
      maternity: 90,
      paternity: 15,
      childcare: 150,
      ordination: 120,
      military: 60,
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchSupervisors();
    fetchFaculties();
  }, []);

  // เมื่อเลือกคณะ ให้โหลดสาขาของคณะนั้น
  useEffect(() => {
    if (selectedFacultyId) {
      fetchDepartments(selectedFacultyId);
    } else {
      setDepartments([]);
    }
  }, [selectedFacultyId]);

  const fetchFaculties = async () => {
    try {
      const response = await facultiesAPI.getAll();
      setFaculties(response.data);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

  const fetchDepartments = async (facultyId) => {
    try {
      const response = await departmentsAPI.getAll(facultyId);
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Sort by employeeId
      const sortedUsers = response.data.sort((a, b) =>
        a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true })
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await usersAPI.getSupervisors();
      setSupervisors(response.data);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("leaveBalance.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        leaveBalance: { ...prev.leaveBalance, [field]: parseInt(value) || 0 },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      // Set faculty and fetch departments for this user
      const userFacultyId =
        user.department?.facultyId || user.department?.faculty?.id || "";
      if (userFacultyId) {
        setSelectedFacultyId(userFacultyId.toString());
        fetchDepartments(userFacultyId);
      } else {
        setSelectedFacultyId("");
        setDepartments([]);
      }
      setFormData({
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: "",
        departmentId: user.departmentId || user.department?.id || "",
        position: user.position || "",
        role: user.role,
        supervisorId: user.supervisorId || user.supervisor?.id || "",
        startDate: user.startDate ? user.startDate.split("T")[0] : "",
        leaveBalance: user.leaveBalance || {
          sick: 60,
          personal: 45,
          vacation: 10,
          maternity: 90,
          paternity: 15,
          childcare: 150,
          ordination: 120,
          military: 60,
        },
      });
    } else {
      setEditingUser(null);
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        departmentId: "",
        position: "",
        role: "employee",
        supervisorId: "",
        startDate: "",
        leaveBalance: {
          sick: 60,
          personal: 45,
          vacation: 10,
          maternity: 90,
          paternity: 15,
          childcare: 150,
          ordination: 120,
          military: 60,
        },
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) delete dataToSend.password;
      if (!dataToSend.supervisorId) dataToSend.supervisorId = null;

      if (editingUser) {
        await usersAPI.update(editingUser.id || editingUser._id, dataToSend);
        toast.success("แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว");
      } else {
        await usersAPI.create(dataToSend);
        toast.success("เพิ่มบุคลากรเรียบร้อยแล้ว");
      }
      fetchUsers();
      fetchSupervisors();
      setModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await toast.confirm("คุณต้องการลบบุคลากรนี้หรือไม่?");
    if (!confirmed) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
      fetchSupervisors();
      toast.success("ลบบุคลากรเรียบร้อยแล้ว");
    } catch (error) {
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const getRoleName = (role) => {
    const roles = {
      admin: "ผู้ดูแลระบบ",
      head: "หัวหน้างาน",
      employee: "บุคลากร",
    };
    return roles[role] || role;
  };

  // Reset password handlers
  const openResetModal = (user) => {
    setUserToReset(user);
    setNewPassword("");
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!userToReset) return;

    try {
      await usersAPI.resetPassword(
        userToReset.id || userToReset._id,
        newPassword
      );
      toast.success(
        `รีเซ็ตรหัสผ่านของ ${userToReset.firstName} ${userToReset.lastName} เรียบร้อยแล้ว`
      );
      setResetModalOpen(false);
      setUserToReset(null);
      setNewPassword("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน"
      );
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: {
        bg: "linear-gradient(135deg, #ff6b6b, #ee5a5a)",
        color: "white",
      },
      head: {
        bg: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
      },
      employee: { bg: "#e2e8f0", color: "#4a5568" },
    };
    const style = styles[role] || styles.employee;
    return (
      <span
        className="role-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {getRoleName(role)}
      </span>
    );
  };

  // Import handlers
  const openImportModal = () => {
    setImportModalOpen(true);
    setImportFile(null);
    setImportResults(null);
  };

  const handleImportUsers = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await usersAPI.importUsers(formData);
      setImportResults(response.data.results);
      toast.success(response.data.message);
      fetchUsers();
      fetchSupervisors();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล"
      );
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportResults(null);
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
      <div className="user-management-page">
        <div className="page-header">
          <div>
            <h1>จัดการบุคลากร</h1>
            <p>จัดการข้อมูลบุคลากรในระบบ ({users.length} คน)</p>
          </div>
          <div className="header-actions">
            <button className="import-btn" onClick={openImportModal}>
              <FaFileImport style={{ marginRight: "6px" }} /> นำเข้าข้อมูล
            </button>
            <button className="add-btn" onClick={() => openModal()}>
              <FaPlus style={{ marginRight: "6px" }} /> เพิ่มบุคลากร
            </button>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ-นามสกุล</th>
                <th>อีเมล</th>
                <th>สาขาวิชา/หน่วยงาน</th>
                <th>ตำแหน่ง</th>
                <th>บทบาท</th>
                <th>วันลาคงเหลือ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id || user._id}>
                  <td>{user.employeeId}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {user.firstName?.charAt(0)}
                      </div>
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.department?.name || user.department || "-"}</td>
                  <td>{user.position}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div className="leave-balance-cell">
                      <span title="ลาป่วย">
                        <FaHospital /> {user.leaveBalance?.sick || 0}
                      </span>
                      <span title="ลากิจ">
                        <FaClipboardList /> {user.leaveBalance?.personal || 0}
                      </span>
                      <span title="ลาพักร้อน">
                        <FaUmbrellaBeach /> {user.leaveBalance?.vacation || 0}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="edit-btn-admin"
                        onClick={() => openModal(user)}
                        title="แก้ไข"
                      >
                        <FaEdit style={{ color: "white" }} />
                      </button>
                      <button
                        className="reset-btn-admin"
                        onClick={() => openResetModal(user)}
                        title="รีเซ็ตรหัสผ่าน"
                      >
                        <FaKey style={{ color: "white" }} />
                      </button>
                      <button
                        className="delete-btn-admin"
                        onClick={() => handleDelete(user.id || user._id)}
                        title="ลบ"
                      >
                        <FaTrash style={{ color: "white" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div
              className="modal-content user-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>
                {editingUser ? (
                  <>
                    <FaEdit style={{ marginRight: "8px" }} /> แก้ไขบุคลากร
                  </>
                ) : (
                  <>
                    <FaPlus style={{ marginRight: "8px" }} /> เพิ่มบุคลากร
                  </>
                )}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>รหัสพนักงาน</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>อีเมล</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ชื่อ</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>นามสกุล</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>คณะ/สำนัก/สถาบัน</label>
                    <select
                      name="facultyId"
                      value={selectedFacultyId}
                      onChange={(e) => {
                        setSelectedFacultyId(e.target.value);
                        setFormData({ ...formData, departmentId: "" });
                      }}
                      required
                    >
                      <option value="">-- เลือกคณะ --</option>
                      {faculties.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>สาขาวิชา/หน่วยงาน</label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      required
                      disabled={!selectedFacultyId}
                    >
                      <option value="">
                        {selectedFacultyId
                          ? "-- เลือกสาขา --"
                          : "-- เลือกคณะก่อน --"}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ตำแหน่ง</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>วันเริ่มรับราชการ</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>บทบาท</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="employee">บุคลากร</option>
                      <option value="head">หัวหน้างาน</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>หัวหน้างาน</label>
                    <select
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                    >
                      <option value="">-- ไม่มี --</option>
                      {supervisors.map((sup) => (
                        <option
                          key={sup.id || sup._id}
                          value={sup.id || sup._id}
                        >
                          {sup.firstName} {sup.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label>รหัสผ่าน</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                )}

                <div className="form-section-title">วันลาคงเหลือ</div>
                <div className="form-row three-cols">
                  <div className="form-group">
                    <label>🏥 ลาป่วย</label>
                    <input
                      type="number"
                      name="leaveBalance.sick"
                      value={formData.leaveBalance.sick}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label>📋 ลากิจ</label>
                    <input
                      type="number"
                      name="leaveBalance.personal"
                      value={formData.leaveBalance.personal}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label>🏖️ ลาพักร้อน</label>
                    <input
                      type="number"
                      name="leaveBalance.vacation"
                      value={formData.leaveBalance.vacation}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn-form-edit"
                    onClick={() => setModalOpen(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="submit-btn-form-edit">
                    {editingUser ? "บันทึก" : "เพิ่ม"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setResetModalOpen(false)}
          >
            <div
              className="modal-content reset-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>
                <FaKey style={{ marginRight: "8px" }} /> รีเซ็ตรหัสผ่าน
              </h3>
              <p className="reset-info">
                รีเซ็ตรหัสผ่านให้{" "}
                <strong>
                  {userToReset?.firstName} {userToReset?.lastName}
                </strong>
              </p>
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn-form-editpass"
                    onClick={() => setResetModalOpen(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="submit-btn-form-editpass">
                    รีเซ็ตรหัสผ่าน
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {importModalOpen && (
          <div className="modal-overlay" onClick={closeImportModal}>
            <div
              className="modal-content import-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>
                <FaFileImport style={{ marginRight: "8px" }} />{" "}
                นำเข้าข้อมูลบุคลากร
              </h3>

              {!importResults ? (
                <form onSubmit={handleImportUsers}>
                  <div className="import-info">
                    <p>อัปโหลดไฟล์ CSV หรือ Excel (.xlsx) ที่มีข้อมูลบุคลากร</p>
                    <div className="template-info">
                      <strong>คอลัมน์ที่ต้องมี:</strong>
                      <code>
                        employeeId, firstName, lastName, email, password,
                        position
                      </code>
                      <br />
                      <strong>คอลัมน์เพิ่มเติม (ไม่บังคับ):</strong>
                      <code>role, departmentId, supervisorId</code>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>เลือกไฟล์</label>
                    <input
                      type="file"
                      className="import-file-input"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={closeImportModal}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="submit-btn-import-submit"
                      disabled={importing}
                    >
                      {importing ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="import-results">
                  <div className="results-summary">
                    <div className="result-success">
                      <FaCheckCircle />
                      <span>สำเร็จ: {importResults.success.length} รายการ</span>
                    </div>
                    <div className="result-failed">
                      <FaTimesCircle />
                      <span>ล้มเหลว: {importResults.failed.length} รายการ</span>
                    </div>
                  </div>

                  {importResults.failed.length > 0 && (
                    <div className="failed-list">
                      <strong>รายการที่ล้มเหลว:</strong>
                      <ul>
                        {importResults.failed.map((item, index) => (
                          <li key={index}>
                            แถว {item.row} ({item.employeeId}): {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button className="submit-btn" onClick={closeImportModal}>
                      ปิด
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;
