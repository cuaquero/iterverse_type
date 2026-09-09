import { getEffectiveSentences } from "../services/contentAdmin";

// Array of { id, topic, text } — the shipped pack (see
// src/constants/LOCAL_HISTORY_GUIDE.md before editing it directly) merged
// with any per-device overrides an instructor made through /admin.
const LOCAL_HISTORY_SENTENCES = getEffectiveSentences();

export { LOCAL_HISTORY_SENTENCES };
export default LOCAL_HISTORY_SENTENCES;
