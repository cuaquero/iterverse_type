import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import styled, { useTheme } from "styled-components";
import { useLocale } from "../../../context/LocaleContext";
import {
  parseCustomWordsText,
  CUSTOM_WORDS_MAX_TEXT,
} from "../../../scripts/customWords";

const ThemedScope = styled.div`
  color: ${({ theme }) => theme.text};
  font-family: ${({ theme }) => theme.fontFamily};

  .MuiInputBase-input,
  .MuiInputBase-root {
    color: ${({ theme }) => theme.text};
    font-family: ${({ theme }) => theme.fontFamily};
  }
  .MuiInputLabel-root {
    color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiInputLabel-root.Mui-focused {
    color: ${({ theme }) => theme.stats};
  }
  .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.textTypeBox}55;
  }
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.stats};
  }
  .MuiFormHelperText-root {
    color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiFormHelperText-root.Mui-error {
    color: #ff6b6b;
  }
  .MuiSvgIcon-root {
    color: ${({ theme }) => theme.text};
    opacity: 0.85;
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

const FieldRow = ({ label, hint, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6, fontWeight: 500 }}>
      {label}
    </div>
    {children}
    {hint && (
      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{hint}</div>
    )}
  </div>
);

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object}  props.draft               — { id, name, language, text }
 * @param {(d: object) => void} props.onChange
 * @param {(d: object) => void} props.onSave
 * @param {() => void} props.onCancel
 * @param {() => void} [props.onDelete]
 * @param {boolean} [props.isExisting]
 * @param {string[]} [props.existingNames]
 */
const CustomWordsEditor = ({
  open,
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  isExisting = false,
  existingNames = [],
}) => {
  const { t } = useLocale();
  const stcTheme = useTheme();
  const [nameError, setNameError] = useState("");
  const [local, setLocal] = useState(draft);

  React.useEffect(() => {
    if (open && draft) {
      setLocal(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft?.id]);

  const parsed = useMemo(() => {
    if (!local) return [];
    return parseCustomWordsText(local);
  }, [local]);

  if (!draft || !local) return null;

  const set = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const setName = (name) => {
    setNameError("");
    set({ name });
  };

  const setText = (text) => {
    if (text.length > CUSTOM_WORDS_MAX_TEXT) {
      text = text.slice(0, CUSTOM_WORDS_MAX_TEXT);
    }
    set({ text });
  };

  const placeholder = t("custom_words_placeholder_en");
  const formatHint = t("custom_words_format_hint_en");

  const handleSave = () => {
    const name = (local.name || "").trim();
    if (!name) {
      setNameError(t("custom_words_name_required"));
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setNameError(t("custom_words_name_duplicate"));
      return;
    }
    if (parsed.length === 0) {
      setNameError(t("custom_words_empty_warning"));
      return;
    }
    setNameError("");
    const next = { ...local, name };
    onSave(next);
  };

  const handleCancel = () => onCancel();

  const handleDelete = () => {
    if (window.confirm(t("custom_words_confirm_delete"))) onDelete();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.08)" } } }}
      PaperProps={{
        sx: {
          background: stcTheme.background,
          color: stcTheme.text,
          fontFamily: stcTheme.fontFamily,
          backgroundColor: stcTheme.background,
          border: `1px solid ${stcTheme.textTypeBox}30`,
        },
      }}
    >
      <ThemedScope>
        <DialogContent sx={{ pb: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, color: stcTheme.title }}>
                {t("custom_words_editor_title")}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                {t("custom_words_editor_subtitle")}
              </div>
            </div>
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>

          <div style={{ marginTop: 18 }}>
            <FieldRow label={t("custom_words_field_name")}>
              <TextField
                size="small"
                fullWidth
                value={local.name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("custom_words_field_name_placeholder")}
                error={!!nameError}
                helperText={nameError || ""}
                inputProps={{ maxLength: 40 }}
              />
            </FieldRow>

            <FieldRow label={t("custom_words_field_words")} hint={formatHint}>
              <TextField
                size="small"
                multiline
                minRows={8}
                maxRows={16}
                fullWidth
                value={local.text || ""}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                inputProps={{ style: { fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 } }}
              />
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
                {t("custom_words_parsed_count", parsed.length)}
              </div>
            </FieldRow>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <div>
            {isExisting && onDelete && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDelete}
              >
                {t("custom_words_action_delete")}
              </Button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="small" onClick={handleCancel}>
              {t("custom_words_action_cancel")}
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              {isExisting ? t("custom_words_action_save") : t("custom_words_action_save_activate")}
            </Button>
          </div>
        </DialogActions>
      </ThemedScope>
    </Dialog>
  );
};

export default CustomWordsEditor;
