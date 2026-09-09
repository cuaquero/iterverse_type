import React from "react";

const Logo = () => {
  return (
    <div className="header">
      <div className="logo-row">
        <div className="logo-top">
          <h1 className="logo-title">
            <span className="logo-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 92 92" width="20" height="20">
                <polygon
                  points="30,18 62,18 78,46 62,74 30,74 14,46"
                  fill="none"
                  stroke="#d22030"
                  strokeWidth="11"
                  strokeLinejoin="miter"
                />
                <rect x="41.5" y="31" width="9" height="30" fill="currentColor" />
              </svg>
            </span>
            <span className="logo-wordmark">
              <span className="logo-wordmark-iter">iter</span>
              <span className="logo-wordmark-verse">verse</span>
            </span>{" "}
            <span className="logo-accent logo-product-name">Type</span>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Logo;
