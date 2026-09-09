import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styled, { useTheme } from "styled-components";
import {
  SOURCE_OPTIONS,
  SESSION_LENGTH_OPTIONS,
  loadKioskSettings,
  saveKioskSettings,
} from "../../../services/kioskSettings";

const ThemedScope = styled.div`
  color: ${({ theme }) => theme.text};
  font-family: ${({ theme }) => theme.fontFamily};

  .MuiSvgIcon-root {
    color: ${({ theme }) => theme.text};
  }
  .MuiButton-text {
    color: ${({ theme }) => theme.text};
  }
  .MuiButton-contained {
    background: ${({ theme }) => theme.stats};
    color: ${({ theme }) => theme.background};
    &:hover { background: ${({ theme }) => theme.stats}; opacity: 0.85; }
  }
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.7;
  margin-bottom: 10px;
`;

const Section = styled.div`
  margin-bottom: 22px;
`;

const ModeRow = styled.div`
  display: flex;
  gap: 8px;
`;

const ModeButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.textTypeBox}55;
  background: ${({ $active, theme }) => ($active ? theme.stats : "transparent")};
  color: ${({ $active, theme }) => ($active ? theme.background : theme.text)};
  cursor: pointer;
`;

const SessionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SessionButton = styled(ModeButton)`
  flex: 0 0 auto;
  padding: 8px 14px;
`;

const PoolCount = styled.div`
  font-size: 12px;
  opacity: 0.6;
  margin-top: 8px;
`;

/**
 * Staff-facing settings for a kiosk session: which content sources feed it,
 * word vs. sentence mode, and how long a session runs before it resets to
 * a fresh one. Saved to localStorage (src/services/kioskSettings.js) and
 * read by KioskPage on load — this modal doesn't render the kiosk itself.
 */
const CustomizeKioskModal = ({ open, onClose }) => {
  const stcTheme = useTheme();
  const [settings, setSettings] = useState(() => loadKioskSettings());

  if (!open) return null;

  const setMode = (mode) => setSettings((s) => ({ ...s, mode }));
  const setSessionSeconds = (sessionSeconds) =>
    setSettings((s) => ({ ...s, sessionSeconds }));
  const toggleSource = (key) =>
    setSettings((s) => ({
      ...s,
      sources: s.sources.includes(key)
        ? s.sources.filter((k) => k !== key)
        : [...s.sources, key],
    }));

  const handleLaunch = () => {
    saveKioskSettings(settings);
    window.location.href = "/kiosk";
  };

  const handleSaveOnly = () => {
    saveKioskSettings(settings);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.5)" } }}
      PaperProps={{
        sx: {
          background: stcTheme.background,
          color: stcTheme.text,
          fontFamily: stcTheme.fontFamily,
          border: `1px solid ${stcTheme.textTypeBox}30`,
        },
      }}
    >
      <ThemedScope>
        <DialogContent sx={{ pb: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Customize Kiosk Session</div>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>

          <Section>
            <SectionLabel>Mode</SectionLabel>
            <ModeRow>
              <ModeButton $active={settings.mode === "sentence"} onClick={() => setMode("sentence")}>
                Sentence
              </ModeButton>
              <ModeButton $active={settings.mode === "word"} onClick={() => setMode("word")}>
                Word
              </ModeButton>
            </ModeRow>
          </Section>

          {settings.mode === "sentence" && (
            <Section>
              <SectionLabel>Content sources</SectionLabel>
              {SOURCE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={settings.sources.includes(opt.key)}
                      onChange={() => toggleSource(opt.key)}
                      sx={{ color: stcTheme.textTypeBox, "&.Mui-checked": { color: stcTheme.stats } }}
                    />
                  }
                  label={opt.label}
                  sx={{ display: "flex", "& .MuiFormControlLabel-label": { fontSize: 14 } }}
                />
              ))}
              {settings.sources.length === 0 && (
                <PoolCount>No sources checked — will fall back to all local history.</PoolCount>
              )}
            </Section>
          )}

          <Section>
            <SectionLabel>Session length</SectionLabel>
            <SessionRow>
              {SESSION_LENGTH_OPTIONS.map((secs) => (
                <SessionButton
                  key={secs}
                  $active={settings.sessionSeconds === secs}
                  onClick={() => setSessionSeconds(secs)}
                >
                  {secs}s
                </SessionButton>
              ))}
            </SessionRow>
          </Section>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button size="small" onClick={handleSaveOnly}>
            Save
          </Button>
          <Button size="small" variant="contained" onClick={handleLaunch}>
            Save &amp; Launch Kiosk
          </Button>
        </DialogActions>
      </ThemedScope>
    </Dialog>
  );
};

export default CustomizeKioskModal;
