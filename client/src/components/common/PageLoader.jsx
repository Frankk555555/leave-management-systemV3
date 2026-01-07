import React from "react";
import Loading from "./Loading";

/**
 * PageLoader - Suspense Fallback Component
 * Uses unified Loading component for consistent design
 */
const PageLoader = () => {
  return <Loading size="fullpage" text="กำลังโหลด..." />;
};

export default PageLoader;
