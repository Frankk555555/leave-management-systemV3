import React, { useState, useEffect, useRef } from "react";
import { usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import Navbar from "../components/common/Navbar";
import {
  FaUser,
  FaSave,
  FaCamera,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaIdCard,
  FaBuilding,
  FaBriefcase,
} from "react-icons/fa";
import "./Profile.css";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords if changing
    if (formData.password && formData.password.trim() !== "") {
      // ต้องกรอกยืนยันรหัสผ่านด้วย
      if (!formData.confirmPassword || formData.confirmPassword.trim() === "") {
        toast.error("กรุณากรอกยืนยันรหัสผ่านใหม่");
        return;
      }

      // รหัสผ่านต้องตรงกัน
      if (formData.password !== formData.confirmPassword) {
        toast.error("รหัสผ่านไม่ตรงกัน");
        return;
      }

      // รหัสผ่านต้องมีอย่างน้อย 6 ตัว
      if (formData.password.length < 6) {
        toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };

      // Only include password if it's being changed
      if (formData.password && formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      await usersAPI.updateProfile(updateData);
      toast.success("อัปเดตโปรไฟล์เรียบร้อยแล้ว");

      // Clear password fields
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });

      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await usersAPI.updateProfileImage(formData);
      toast.success("อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว");

      // รีเฟรชหน้าเพื่อแสดงรูปใหม่
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูป"
      );
    } finally {
      setImageLoading(false);
    }
  };

  const getProfileImageUrl = () => {
    if (user?.profileImage) {
      return `http://localhost:5000${user.profileImage}`;
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>
              <FaUser style={{ marginRight: "10px" }} />
              โปรไฟล์ของฉัน
            </h1>
            <p>แก้ไขข้อมูลส่วนตัวของคุณ</p>
          </div>

          <div className="profile-content">
            {/* Profile Image Section */}
            <div className="profile-image-section">
              <div
                className={`profile-avatar ${imageLoading ? "loading" : ""}`}
                onClick={handleImageClick}
              >
                {getProfileImageUrl() ? (
                  <img src={getProfileImageUrl()} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    <FaUser size={48} />
                  </div>
                )}
                <div className="avatar-overlay">
                  <FaCamera size={24} />
                  <span>เปลี่ยนรูป</span>
                </div>
                {imageLoading && (
                  <div className="avatar-loading">กำลังอัปโหลด...</div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
              />
              <p className="image-hint">
                คลิกเพื่อเปลี่ยนรูปโปรไฟล์ (สูงสุด 5MB)
              </p>
            </div>

            {/* User Info Display */}
            <div className="profile-info-card">
              <div className="info-item">
                <FaIdCard className="info-icon" />
                <div>
                  <label>รหัสพนักงาน</label>
                  <span>{user?.employeeId}</span>
                </div>
              </div>
              <div className="info-item">
                <FaBuilding className="info-icon" />
                <div>
                  <label>สาขา/หน่วยงาน</label>
                  <span>{user?.department?.name || "-"}</span>
                </div>
              </div>
              <div className="info-item">
                <FaBriefcase className="info-icon" />
                <div>
                  <label>ตำแหน่ง</label>
                  <span>{user?.position || "-"}</span>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="profile-form">
              <h3>แก้ไขข้อมูลส่วนตัว</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FaUser style={{ marginRight: "6px" }} />
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaUser style={{ marginRight: "6px" }} />
                    นามสกุล
                  </label>
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
                  <label>
                    <FaEnvelope style={{ marginRight: "6px" }} />
                    อีเมล
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaPhone style={{ marginRight: "6px" }} />
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0812345678"
                  />
                </div>
              </div>

              <h3 style={{ marginTop: "1.5rem" }}>
                เปลี่ยนรหัสผ่าน (ถ้าต้องการ)
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FaLock style={{ marginRight: "6px" }} />
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยน"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaLock style={{ marginRight: "6px" }} />
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  <FaSave style={{ marginRight: "6px" }} />
                  {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
