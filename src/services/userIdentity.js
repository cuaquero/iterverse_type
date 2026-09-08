// getUserName/setUserName/getUserTag were removed along with Profile (the
// only consumers). getUserId is kept — it's still used by services/leaderboard.js
// (reused by the new kiosk leaderboard feature) for per-device dedup.
const USER_ID_KEY = "eletypes-user-id";

const generateUserId = () => {
  return "user_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
};

export const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};
