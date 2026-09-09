import LOCAL_HISTORY_SENTENCES from "../constants/LocalHistorySentences";
import { ENGLISH_SENTENCES } from "../constants/SentencesCollection";
import { COMMON_WORDS } from "../constants/WordsMostCommon";

const STORAGE_KEY = "kiosk-settings";

// Checkbox options shown in the Customize Kiosk modal when mode is
// "sentence". `topic` matches LocalHistorySentences.json's own topic field
// (null means "pull from the generic sentence pack instead").
export const SOURCE_OPTIONS = [
  { key: "cache_valley", label: "Cache Valley", topic: "Cache Valley" },
  { key: "box_elder", label: "Box Elder County", topic: "Box Elder County" },
  { key: "btech_history", label: "BTECH History", topic: "Bridgerland Technical College" },
  { key: "utah", label: "Utah", topic: "Utah" },
  { key: "general_sentences", label: "General sentences", topic: null },
];

export const SESSION_LENGTH_OPTIONS = [30, 60, 90, 120];

export const TAP_MODE_LENGTH_OPTIONS = [15, 30, 60];

export const DEFAULT_KIOSK_SETTINGS = {
  mode: "sentence", // "sentence" | "word"
  sources: ["cache_valley", "box_elder", "btech_history", "utah"],
  sessionSeconds: 60,
  tapModeSeconds: 30,
};

export const loadKioskSettings = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KIOSK_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_KIOSK_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_KIOSK_SETTINGS;
  }
};

export const saveKioskSettings = (settings) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// Builds the active { text, topic } pool for sentence mode from whichever
// sources are checked. Falls back to the full local-history pack if nothing
// is selected, so a misconfigured kiosk never shows an empty screen.
export const buildSentencePool = (sources) => {
  const pool = [];
  const selectedTopics = SOURCE_OPTIONS.filter(
    (o) => sources.includes(o.key) && o.topic
  ).map((o) => o.topic);

  if (selectedTopics.length > 0) {
    pool.push(
      ...LOCAL_HISTORY_SENTENCES.filter((s) => selectedTopics.includes(s.topic))
    );
  }
  if (sources.includes("general_sentences")) {
    pool.push(
      ...Object.values(ENGLISH_SENTENCES).map((e) => ({ text: e.val, topic: null }))
    );
  }
  return pool.length > 0 ? pool : LOCAL_HISTORY_SENTENCES;
};

const WORD_CHUNK_LENGTH = 10;
const WORD_CHUNK_COUNT = 20;

// Word mode reuses the exact same one-chunk-at-a-time sentence UI (caret,
// 3-state coloring, completion flow) — a "chunk" is just several random
// common words joined like a sentence, with no history topic to attach.
export const buildWordPool = () => {
  const words = COMMON_WORDS.map((w) => (typeof w === "string" ? w : w.val)).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < WORD_CHUNK_COUNT; i++) {
    const chunk = [];
    for (let j = 0; j < WORD_CHUNK_LENGTH; j++) {
      chunk.push(words[Math.floor(Math.random() * words.length)]);
    }
    chunks.push({ text: chunk.join(" ") + ".", topic: null });
  }
  return chunks;
};
