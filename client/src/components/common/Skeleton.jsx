import React from "react";
import "./Skeleton.css";

// Base skeleton element
const SkeletonElement = ({ type, width, height, className = "" }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return <div className={`skeleton ${type} ${className}`} style={style} />;
};

// Card skeleton for dashboard stats
export const StatCardSkeleton = () => (
  <div className="skeleton-stat-card">
    <SkeletonElement type="circle" width="60px" height="60px" />
    <div className="skeleton-stat-info">
      <SkeletonElement type="text" width="80px" height="32px" />
      <SkeletonElement type="text" width="100px" height="16px" />
    </div>
  </div>
);

// Leave balance item skeleton
export const LeaveBalanceSkeleton = () => (
  <div className="skeleton-balance-item">
    <SkeletonElement type="circle" width="48px" height="48px" />
    <div className="skeleton-balance-info">
      <SkeletonElement type="text" width="80px" height="14px" />
      <SkeletonElement type="text" width="60px" height="16px" />
    </div>
    <SkeletonElement type="text" width="40px" height="24px" />
  </div>
);

// Request item skeleton
export const RequestItemSkeleton = () => (
  <div className="skeleton-request-item">
    <SkeletonElement type="circle" width="40px" height="40px" />
    <div className="skeleton-request-info">
      <SkeletonElement type="text" width="100px" height="14px" />
      <SkeletonElement type="text" width="140px" height="12px" />
    </div>
    <SkeletonElement type="text" width="50px" height="14px" />
  </div>
);

// Card skeleton for leave history
export const LeaveCardSkeleton = () => (
  <div className="skeleton-leave-card">
    <div className="skeleton-card-header">
      <div className="skeleton-type-info">
        <SkeletonElement type="circle" width="36px" height="36px" />
        <SkeletonElement type="text" width="80px" height="16px" />
      </div>
      <SkeletonElement type="badge" width="60px" height="24px" />
    </div>
    <div className="skeleton-card-body">
      <div className="skeleton-date-range">
        <SkeletonElement type="text" width="80px" height="14px" />
        <SkeletonElement type="text" width="20px" height="14px" />
        <SkeletonElement type="text" width="80px" height="14px" />
      </div>
      <SkeletonElement type="badge" width="60px" height="24px" />
      <SkeletonElement type="text" width="100%" height="40px" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="skeleton-table-row">
    {Array(columns)
      .fill(0)
      .map((_, index) => (
        <td key={index}>
          <SkeletonElement
            type="text"
            width={`${60 + Math.random() * 40}%`}
            height="16px"
          />
        </td>
      ))}
  </tr>
);

// Approval card skeleton
export const ApprovalCardSkeleton = () => (
  <div className="skeleton-approval-card">
    <div className="skeleton-card-header">
      <div className="skeleton-employee-info">
        <SkeletonElement type="circle" width="48px" height="48px" />
        <div>
          <SkeletonElement type="text" width="120px" height="16px" />
          <SkeletonElement type="text" width="80px" height="12px" />
        </div>
      </div>
      <SkeletonElement type="badge" width="80px" height="28px" />
    </div>
    <div className="skeleton-card-body">
      <SkeletonElement type="text" width="100%" height="60px" />
    </div>
    <div className="skeleton-card-actions">
      <SkeletonElement type="button" width="48%" height="40px" />
      <SkeletonElement type="button" width="48%" height="40px" />
    </div>
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="skeleton-content-grid">
      <div className="skeleton-card">
        <SkeletonElement
          type="text"
          width="150px"
          height="20px"
          className="skeleton-title"
        />
        {[1, 2, 3, 4].map((i) => (
          <LeaveBalanceSkeleton key={i} />
        ))}
      </div>
      <div className="skeleton-card">
        <SkeletonElement
          type="text"
          width="150px"
          height="20px"
          className="skeleton-title"
        />
        {[1, 2, 3].map((i) => (
          <RequestItemSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Full page loader
export const PageSkeleton = ({ type = "default" }) => {
  switch (type) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "cards":
      return (
        <div className="skeleton-cards-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LeaveCardSkeleton key={i} />
          ))}
        </div>
      );
    case "table":
      return (
        <div className="skeleton-table-container">
          <table className="skeleton-table">
            <thead>
              <tr>
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i}>
                    <SkeletonElement type="text" width="80%" height="16px" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <div className="skeleton-default">
          <SkeletonElement type="title" width="200px" height="32px" />
          <SkeletonElement type="text" width="300px" height="16px" />
          <div className="skeleton-content">
            {[1, 2, 3].map((i) => (
              <SkeletonElement key={i} type="text" width="100%" height="60px" />
            ))}
          </div>
        </div>
      );
  }
};

export default SkeletonElement;
