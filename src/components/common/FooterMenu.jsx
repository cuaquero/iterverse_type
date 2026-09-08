import React from "react";
import { AppBar } from "@mui/material";
import { Tooltip } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import Select from "../utils/Select";
import {
  WORD_MODE_LABEL,
  SENTENCE_MODE_LABEL,
  GAME_MODE_DEFAULT,
  GAME_MODE_SENTENCE,
} from "../../constants/Constants";
import KeyboardAltOutlinedIcon from "@mui/icons-material/KeyboardAltOutlined";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { useLocale } from "../../context/LocaleContext";
import { buildGroupedOptions, findOptionForTheme } from "../../style/customThemes";

const FooterMenu = ({
  theme,
  soundMode,
  toggleSoundMode,
  soundOptions,
  soundType,
  handleSoundTypeChange,
  handleThemeChange,
  gameMode,
  handleGameModeChange,
  isTrainerMode,
  toggleTrainerMode,
}) => {
  const { t } = useLocale();
  const isSpecialMode = isTrainerMode;
  const groupedThemeOptions = buildGroupedOptions(t);
  const themeOptionValue = findOptionForTheme(groupedThemeOptions, theme);

  const activeCls = (on) => (on ? "nav-item-active" : "nav-item");
  const modeCls = (currMode, buttonMode) => {
    if (isSpecialMode) return "nav-mode";
    return currMode === buttonMode ? "nav-mode-active" : "nav-mode";
  };

  const handleWordSentenceMode = (mode) => {
    if (isTrainerMode) toggleTrainerMode();
    handleGameModeChange(mode);
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      className="bottomBar"
      elevation={0}
    >
      <div className="nav-container">
        {/* Group 1: Game Modes */}
        <div className="nav-group">
          <span className="nav-group-label">{t("nav_mode")}</span>
          <div className="nav-group-items">
            <IconButton
              size="small"
              onClick={() => handleWordSentenceMode(GAME_MODE_DEFAULT)}
            >
              <span className={modeCls(gameMode, GAME_MODE_DEFAULT)}>
                {WORD_MODE_LABEL}
              </span>
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleWordSentenceMode(GAME_MODE_SENTENCE)}
            >
              <span className={modeCls(gameMode, GAME_MODE_SENTENCE)}>
                {SENTENCE_MODE_LABEL}
              </span>
            </IconButton>
            <IconButton size="small" onClick={toggleTrainerMode}>
              <Tooltip title={t("trainer_mode")}>
                <span className={activeCls(isTrainerMode)}>
                  <KeyboardAltOutlinedIcon fontSize="small" />
                </span>
              </Tooltip>
            </IconButton>
            <IconButton size="small" onClick={() => window.location.href = "/kiosk"}>
              <Tooltip title="Kiosk Mode (for events)">
                <span className="nav-item">
                  <TouchAppIcon fontSize="small" />
                </span>
              </Tooltip>
            </IconButton>
          </div>
        </div>

        {/* Group 2 (ultra zen / custom words) lives in a strip above the
            TypeBox words area — see TypeBoxQuickTools. */}

        {/* Group 3: Settings */}
        <div className="nav-group">
          <span className="nav-group-label">{t("nav_settings")}</span>
          <div className="nav-group-items">
            <Select
              classNamePrefix="Select"
              value={themeOptionValue}
              options={groupedThemeOptions}
              isSearchable={false}
              isSelected={false}
              onChange={handleThemeChange}
              menuPlacement="top"
            />
            <IconButton size="small" onClick={toggleSoundMode}>
              <Tooltip title={t("sound_mode_tooltip")}>
                <span className={activeCls(soundMode)}>
                  {soundMode ? (
                    <VolumeUpIcon fontSize="small" />
                  ) : (
                    <VolumeOffIcon fontSize="small" />
                  )}
                </span>
              </Tooltip>
            </IconButton>
            {soundMode && (
              <Select
                classNamePrefix="Select"
                value={soundOptions.find((e) => e.label === soundType)}
                options={soundOptions}
                isSearchable={false}
                isSelected={false}
                onChange={handleSoundTypeChange}
                menuPlacement="top"
              />
            )}
          </div>
        </div>
      </div>

    </AppBar>
  );
};

export default FooterMenu;
