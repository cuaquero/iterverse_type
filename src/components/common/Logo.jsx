import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CustomizeKioskModal from "../features/Kiosk/CustomizeKioskModal";
import btechMark from "../../assets/iterverse/btech-mark.png";

const Logo = () => {
  const [kioskModalOpen, setKioskModalOpen] = useState(false);

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
            <span className="logo-divider" aria-hidden="true"></span>
            <img
              src={btechMark}
              alt="Bridgerland Technical College"
              className="logo-btech-mark"
            />
          </h1>
        </div>
      </div>
      <div style={{ position: "absolute", top: "4px", right: "12px" }}>
        <Tooltip title="Customize Kiosk Session">
          <IconButton size="small" onClick={() => setKioskModalOpen(true)}>
            <TouchAppIcon fontSize="small" className="nav-item" />
          </IconButton>
        </Tooltip>
      </div>
      <CustomizeKioskModal open={kioskModalOpen} onClose={() => setKioskModalOpen(false)} />
    </div>
  );
};

export default Logo;
