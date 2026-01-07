import React from "react";
import "./Loading.css";

/**
 * Unified Loading Component
 * Use throughout the app for consistent loading states
 *
 * @param {string} size - 'small' | 'medium' | 'large' | 'fullpage'
 * @param {string} text - Optional loading text
 * @param {boolean} overlay - Whether to show as overlay
 */
const Loading = ({
  size = "medium",
  text = "กำลังโหลด...",
  overlay = false,
  showText = true,
}) => {
  const sizeClasses = {
    small: "loading-small",
    medium: "loading-medium",
    large: "loading-large",
    fullpage: "loading-fullpage",
  };

  const content = (
    <div className={`loading-wrapper ${sizeClasses[size]}`}>
      <div className="loading-spinner-unified">
        <div className="spinner-ring-1"></div>
        <div className="spinner-ring-2"></div>
        <div className="spinner-ring-3"></div>
      </div>
      {showText && text && <span className="loading-text-unified">{text}</span>}
    </div>
  );

  if (overlay) {
    return <div className="loading-overlay">{content}</div>;
  }

  if (size === "fullpage") {
    return <div className="loading-fullpage-container">{content}</div>;
  }

  return content;
};

// Export a simple spinner for inline use
export const Spinner = ({ size = 20, color = "#667eea" }) => (
  <div
    className="spinner-inline"
    style={{
      width: size,
      height: size,
      borderColor: `${color}20`,
      borderTopColor: color,
    }}
  />
);

export default Loading;
