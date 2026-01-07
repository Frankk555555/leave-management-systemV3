import React, { createContext, useContext, useState, useCallback } from "react";
import "./Toast.css";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const success = useCallback(
    (message) => showToast(message, "success"),
    [showToast]
  );
  const error = useCallback(
    (message) => showToast(message, "error"),
    [showToast]
  );
  const warning = useCallback(
    (message) => showToast(message, "warning"),
    [showToast]
  );
  const info = useCallback(
    (message) => showToast(message, "info"),
    [showToast]
  );

  const confirm = useCallback((message, title = "ยืนยันการดำเนินการ") => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        },
      });
    });
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, confirm }}
    >
      {children}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{getIcon(toast.type)}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="confirm-overlay" onClick={confirmModal.onCancel}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">❓</div>
            <h3 className="confirm-title">{confirmModal.title}</h3>
            <p className="confirm-message">{confirmModal.message}</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel-btn-pass"
                onClick={confirmModal.onCancel}
              >
                ยกเลิก
              </button>
              <button
                className="confirm-ok-btn"
                onClick={confirmModal.onConfirm}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
