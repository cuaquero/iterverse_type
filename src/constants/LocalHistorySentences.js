import LocalHistorySentencesData from "../assets/Vocab/LocalHistorySentences.json";

// Array of { topic, text } shipped with the build (see
// src/constants/LOCAL_HISTORY_GUIDE.md before editing it directly). This
// is a fallback only — live content comes from the shared /api/
// content-sources store (src/services/contentAdmin.js) and is what Kiosk
// mode and Local History mode actually use; this static copy just keeps
// them from showing nothing if that fetch fails (offline, cold start).
const LOCAL_HISTORY_SENTENCES = LocalHistorySentencesData;

export { LOCAL_HISTORY_SENTENCES };
export default LOCAL_HISTORY_SENTENCES;
