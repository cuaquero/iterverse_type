// Kiosk mode's same-day, arcade-style high score board. A kiosk runs on one
// shared physical device that every walk-up visitor uses, so a plain
// localStorage list works fine here — no backend, no per-visitor accounts,
// no network dependency for a booth that may not have reliable WiFi.
const STORAGE_KEY = "kiosk-leaderboard";
const MAX_STORED_ENTRIES = 200;

const todayKey = () => new Date().toDateString();

const readEntries = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeEntries = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_STORED_ENTRIES)));
};

const generateEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const submitKioskScore = ({ initials, wpm }) => {
  const entries = readEntries();
  entries.push({ id: generateEntryId(), initials, wpm: Math.round(wpm), date: todayKey() });
  writeEntries(entries);
  return { result: "new" };
};

export const fetchTodayKioskLeaderboard = (limit = 10) => {
  const today = todayKey();
  return readEntries()
    .filter((e) => e.date === today)
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, limit)
    .map((e) => ({ id: e.id, user_name: e.initials, wpm: e.wpm }));
};

// An instructor running the kiosk can long-press "Today's Top Typists" to
// reveal a delete button per row — for anything a bit of profanity slipped
// past (see INITIALS_BLOCKLIST in bannedWords.js), or any entry that just
// shouldn't be there.
export const deleteKioskEntry = (id) => {
  writeEntries(readEntries().filter((e) => e.id !== id));
};
