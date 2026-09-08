import { supabase } from "./supabase";
import { getFingerprint } from "./fingerprint";
import { getUserId } from "./userIdentity";

const SUBMIT_COOLDOWN_MS = 5000;
let lastSubmitTime = 0;

const computeEffectiveWpm = (wpm, accuracy) =>
  Math.round(wpm * (accuracy / 100) * 100) / 100;

export const submitScore = async ({
  wpm,
  accuracy,
  userName,
  language,
  difficulty,
  duration,
  numberAddon,
  symbolAddon,
}) => {
  if (!supabase) return null;

  const now = Date.now();
  if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
    console.warn("Score submission rate limited");
    return null;
  }
  lastSubmitTime = now;

  const fingerprint = await getFingerprint();
  const userId = getUserId();
  const roundedWpm = Math.round(wpm);
  const roundedAccuracy = Math.round(accuracy * 100) / 100;
  const effectiveWpm = computeEffectiveWpm(roundedWpm, roundedAccuracy);

  // Check if user already has a record for this mode combination
  const { data: existing } = await supabase
    .from("scores")
    .select("id, wpm, effective_wpm")
    .eq("fingerprint", fingerprint)
    .eq("language", language)
    .eq("difficulty", difficulty)
    .eq("duration", duration)
    .eq("number_addon", numberAddon)
    .eq("symbol_addon", symbolAddon)
    .single();

  if (existing) {
    if (effectiveWpm <= existing.effective_wpm) {
      return {
        result: "no_improvement",
        previousBest: existing.wpm,
      };
    }
    const { data, error } = await supabase
      .from("scores")
      .update({
        user_name: userName || "Anonymous",
        user_id: userId,
        wpm: roundedWpm,
        accuracy: roundedAccuracy,
        effective_wpm: effectiveWpm,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select();

    if (error) {
      console.error("Score update error:", error);
      return null;
    }
    return {
      result: "improved",
      previousBest: existing.wpm,
    };
  }

  // First submission for this mode
  const { data, error } = await supabase.from("scores").insert({
    user_id: userId,
    user_name: userName || "Anonymous",
    fingerprint,
    wpm: roundedWpm,
    accuracy: roundedAccuracy,
    effective_wpm: effectiveWpm,
    language,
    difficulty,
    duration,
    number_addon: numberAddon,
    symbol_addon: symbolAddon,
  }).select();

  if (error) {
    console.error("Score submission error:", error);
    return null;
  }
  return { result: "new" };
};

export const fetchLeaderboard = async ({
  language,
  difficulty,
  duration,
  numberAddon,
  symbolAddon,
}) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scores")
    .select("user_name, user_id, wpm, accuracy, created_at")
    .eq("language", language)
    .eq("difficulty", difficulty)
    .eq("duration", duration)
    .eq("number_addon", numberAddon)
    .eq("symbol_addon", symbolAddon)
    .order("effective_wpm", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Leaderboard fetch error:", error);
    return [];
  }
  return data;
};

// ---- Kiosk mode: a same-day, arcade-style high score board. ----
// Distinct from submitScore/fetchLeaderboard above: those keep one
// best-ever row per (fingerprint, mode combo) for the main app's
// personal-best leaderboard. A shared kiosk device reuses the same
// fingerprint for every visitor who walks up to it, so that dedup-by-
// fingerprint logic would make different kids overwrite each other's
// scores. Kiosk submissions are plain inserts instead (every completed
// run that opts in gets its own row), scoped to "today" by created_at
// and tagged language: "kiosk" so they never mix with main-app rows.
const KIOSK_LANGUAGE_TAG = "kiosk";

const startOfTodayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const submitKioskScore = async ({ initials, wpm }) => {
  if (!supabase) return null;

  const { error } = await supabase.from("scores").insert({
    user_name: initials,
    wpm: Math.round(wpm),
    accuracy: 100,
    effective_wpm: Math.round(wpm),
    language: KIOSK_LANGUAGE_TAG,
    difficulty: "kiosk",
    duration: 0,
    number_addon: false,
    symbol_addon: false,
  });

  if (error) {
    console.error("Kiosk score submission error:", error);
    return null;
  }
  return { result: "new" };
};

export const fetchTodayKioskLeaderboard = async (limit = 10) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scores")
    .select("user_name, wpm")
    .eq("language", KIOSK_LANGUAGE_TAG)
    .gte("created_at", startOfTodayIso())
    .order("wpm", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Kiosk leaderboard fetch error:", error);
    return [];
  }
  return data;
};

export const fetchPlayerRank = async ({
  wpm,
  accuracy,
  language,
  difficulty,
  duration,
  numberAddon,
  symbolAddon,
}) => {
  if (!supabase) return null;

  const myEffective = computeEffectiveWpm(Math.round(wpm), Math.round(accuracy * 100) / 100);

  const { count, error } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("language", language)
    .eq("difficulty", difficulty)
    .eq("duration", duration)
    .eq("number_addon", numberAddon)
    .eq("symbol_addon", symbolAddon)
    .gt("effective_wpm", myEffective);

  if (error) {
    console.error("Rank fetch error:", error);
    return null;
  }
  return count + 1;
};
