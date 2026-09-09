/**
 * KioskPage — standalone route at /kiosk.
 *
 * A no-frills typing test for walk-up use at events (giant keyboard, public
 * booths): no login, no ads, no settings drawer — just "type the sentence,
 * see how you did, go again." Content is the local-history sentence pack
 * (see src/constants/LOCAL_HISTORY_GUIDE.md to add more).
 *
 * Styled against the Iterverse design system (see
 * design-system/README.md and assets/iterverse/brand.md in the
 * iterverse_labs repo) — semantic CSS custom properties from tokens.css,
 * not raw hex values, so a future palette change only touches one place.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { createGlobalStyle, keyframes, css } from "styled-components";
import "../assets/iterverse/tokens.css";
import "../assets/iterverse/fonts.css";
import btechMark from "../assets/iterverse/btech-mark.png";
import { submitKioskScore, fetchTodayKioskLeaderboard, deleteKioskEntry } from "../services/leaderboard";
import { INITIALS_BLOCKLIST } from "../constants/bannedWords";
import TapMode from "../components/features/Kiosk/TapMode";
import { loadKioskSettings, buildSentencePool, buildWordPool } from "../services/kioskSettings";
import { playTimeUpChime } from "../services/chime";
import { fetchContentSources } from "../services/contentAdmin";
import { LOCAL_HISTORY_SENTENCES } from "../constants/LocalHistorySentences";

const LEADERBOARD_REFRESH_MS = 20000;
const INITIALS_LENGTH = 3;
const BANNER_HEIGHT = "64px";
const MANAGE_LONG_PRESS_MS = 600;
const MANAGE_MODE_TIMEOUT_MS = 10000;

// Iterverse Type is dark-only (one shared BTECH-branded identity across
// the regular typing test and Kiosk — see src/style/theme.js). tokens.css
// is a vendored, byte-identical copy from iterverse_labs's design-system,
// so the dark palette is layered on here instead of edited into it —
// same values src/style/theme.js's single theme uses.
const KioskGlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    margin: 0;
  }

  :root {
    --surface-page: #232526;
    --surface-card: #36393b;
    --surface-subtle: #3a3a3e;
    --text-body: #f7f7f8;
    --text-muted: #8a8a90;
    --border-subtle: rgba(255, 255, 255, 0.12);
    --border-default: rgba(255, 255, 255, 0.24);
  }
`;

const Screen = styled.div`
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: var(--surface-page);
  color: var(--text-body);
  font-family: var(--font-sans);
  cursor: text;
`;

const Banner = styled.div`
  min-height: ${BANNER_HEIGHT};
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) var(--space-4);

  @media (max-width: 480px) {
    padding: var(--space-2) var(--space-3);
  }
`;

const BrandGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Wordmark = styled.span`
  font-size: 20px;
  line-height: 1;
  letter-spacing: -0.015em;
  opacity: 0.9;
  strong {
    font-weight: var(--fw-bold);
    color: #ffffff;
  }
  em {
    font-style: normal;
    font-weight: 300;
    color: var(--text-muted);
  }
`;

const ProductName = styled.span`
  font-size: 22px;
  font-weight: 400;
  color: #ffffff;
  opacity: 0.9;
  margin-left: 4px;
`;

const BrandDivider = styled.span`
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.25);
  margin-left: 10px;
  flex-shrink: 0;
`;

const BtechMark = styled.img`
  height: 18px;
  width: auto;
  margin-left: 10px;
  flex-shrink: 0;
`;

const ExitLink = styled.a`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  text-decoration: none;
  &:hover {
    color: var(--text-body);
  }
`;

const BannerActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
`;

const SessionTimer = styled.div`
  flex-shrink: 0;
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  font-weight: var(--fw-bold);
  color: ${({ $urgent }) => ($urgent ? "var(--color-danger)" : "var(--text-body)")};
  font-variant-numeric: tabular-nums;
`;

const ModeToggle = styled.button`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--fs-sm);
  font-family: var(--font-sans);
  color: var(--color-brand);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: var(--color-brand-hover);
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-4);
  text-align: center;
`;

const Eyebrow = styled.div`
  font-size: 11px;
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
`;

const SentenceCard = styled.div`
  position: relative;
  max-width: min(90vw, 1000px);
  font-size: clamp(1.5rem, 3.4vw, 2.5rem);
  font-weight: var(--fw-medium);
  line-height: var(--lh-normal);
`;

const blinkingUnderline = keyframes`
  0%, 100% { border-bottom-color: var(--color-brand); }
  50% { border-bottom-color: var(--text-muted); }
`;

const Char = styled.span`
  color: ${({ $state }) =>
    $state === "correct"
      ? "var(--text-body)"
      : $state === "wrong"
      ? "var(--color-danger)"
      : "var(--text-muted)"};
  text-decoration: ${({ $state, $isSpace }) =>
    $state === "wrong" && $isSpace ? "underline" : "none"};
  white-space: pre-wrap;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${blinkingUnderline} 2s infinite;
    `}
`;

const Caret = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  background: var(--color-brand);
  border-radius: 1px;
  transform: ${({ $x, $y }) => `translate(${$x}px, ${$y}px)`};
  height: ${({ $height }) => `${$height}px`};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: transform 80ms ease-out;
  pointer-events: none;
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
`;

const Wpm = styled.div`
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: var(--fw-bold);
  color: var(--color-brand);
`;

const SessionEndCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
`;

const SessionEndMessage = styled.div`
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: var(--fw-bold);
  color: var(--text-body);
`;

const RestartButton = styled.button`
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--fs-md);
  font-family: var(--font-sans);
  font-weight: var(--fw-medium);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: var(--white);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-standard);
  &:hover {
    background: var(--color-brand-hover);
  }
`;

const LeaderboardPanel = styled.div`
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  width: min(220px, calc(100vw - 2 * var(--space-4)));
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: transparent;
  border: 0.8px solid var(--border-subtle);
  text-align: left;
  z-index: 10;
`;

const LeaderboardTitle = styled.div`
  font-size: 11px;
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
  user-select: none;
`;

const LeaderboardList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const LeaderboardRow = styled.li`
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-sm);
  color: var(--text-body);
  font-variant-numeric: tabular-nums;
`;

const LeaderboardRowRight = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const DeleteEntryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-danger);
  color: var(--white);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
`;

const LeaderboardRank = styled.span`
  color: var(--text-muted);
  margin-right: var(--space-2);
`;

const LeaderboardEmpty = styled.div`
  font-size: var(--fs-sm);
  color: var(--text-muted);
`;

const InitialsRow = styled.div`
  display: flex;
  gap: var(--space-2);
`;

const InitialsBox = styled.div`
  width: 2.5rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-2xl);
  font-weight: var(--fw-bold);
  font-family: var(--font-mono);
  color: ${({ $filled }) => ($filled ? "var(--text-body)" : "var(--border-default)")};
  background: transparent;
  border-bottom: 1px solid var(--border-default);
`;

const InitialsPrompt = styled.div`
  font-size: var(--fs-sm);
  color: var(--text-muted);
`;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildShuffledOrder(count, avoidFirst) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (avoidFirst != null && order[0] === avoidFirst && order.length > 1) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

const KioskPage = () => {
  const [viewMode, setViewMode] = useState("typing");
  const [settings, setSettings] = useState(() => loadKioskSettings());
  // Starts with the shipped pack so there's never an empty pool while the
  // live fetch is in flight, then swaps in the shared content-sources data
  // (src/services/contentAdmin.js) once it resolves — an instructor's
  // /admin edits show up here with no code change or deploy.
  const [allSentences, setAllSentences] = useState(LOCAL_HISTORY_SENTENCES);
  const isFirstContentLoadRef = useRef(true);
  useEffect(() => {
    fetchContentSources().then(setAllSentences);
  }, []);
  const sentences = useMemo(
    () => (settings.mode === "word" ? buildWordPool() : buildSentencePool(settings.sources, allSentences)),
    [settings, allSentences]
  );
  const [order, setOrder] = useState(() => buildShuffledOrder(sentences.length));
  const [pointer, setPointer] = useState(0);
  const [typed, setTyped] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [initials, setInitials] = useState("");
  const [initialsSubmitted, setInitialsSubmitted] = useState(false);
  const [initialsRejected, setInitialsRejected] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const manageLongPressRef = useRef(null);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(settings.sessionSeconds);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalWpm, setFinalWpm] = useState(0);
  const inputRef = useRef(null);
  const initialsInputRef = useRef(null);
  const sentenceCardRef = useRef(null);
  const completedWordCountRef = useRef(0);
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0, height: 0, visible: false });

  const current = sentences[order[pointer]];

  // order/pointer are sized against whatever `sentences` was at mount,
  // which is the static fallback (see allSentences above) - once the live
  // fetch resolves and swaps in the real pool, reshuffle against its
  // actual length so `order` never points past the end of a shorter (or
  // into a longer) list. Skips its own first run, which just re-fires for
  // the initial synchronous value and would otherwise flash a different
  // sentence right after mount for no reason.
  useEffect(() => {
    if (isFirstContentLoadRef.current) {
      isFirstContentLoadRef.current = false;
      return;
    }
    setOrder(buildShuffledOrder(sentences.length));
    setPointer(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSentences]);

  // Pulse pacing (see Customize Kiosk Session) highlights the word the
  // visitor is currently typing instead of showing the caret bar — same
  // two styles TypeBox itself offers, ported to Kiosk's char-by-char
  // sentence rendering rather than TypeBox's word-tokenized one.
  const currentWordRange = useMemo(() => {
    if (settings.pacingStyle !== "pulse") return null;
    const text = current.text;
    const pos = Math.min(typed.length, text.length - 1);
    if (pos < 0) return null;
    let start = pos;
    while (start > 0 && text[start - 1] !== " ") start--;
    let end = pos;
    while (end < text.length && text[end] !== " ") end++;
    return [start, end];
  }, [current.text, typed.length, settings.pacingStyle]);

  // Caret position, ported from TypeBox's SmoothCaret: measure the next
  // untyped char span relative to the card so the bar tracks exactly where
  // regular mode's caret pacing style points, instead of Kiosk having no
  // position indicator at all.
  useEffect(() => {
    if (sessionEnded || !sentenceCardRef.current) {
      setCaretPos((p) => ({ ...p, visible: false }));
      return;
    }
    const frame = requestAnimationFrame(() => {
      const container = sentenceCardRef.current;
      if (!container) return;
      const chars = container.querySelectorAll("span[data-char-index]");
      const targetEl = chars[typed.length] || chars[chars.length - 1];
      if (!targetEl) return;
      const placeAfter = typed.length >= chars.length;
      const charRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const x = (placeAfter ? charRect.right : charRect.left) - containerRect.left;
      const y = charRect.top - containerRect.top;
      setCaretPos({ x, y, height: charRect.height, visible: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [typed, sessionEnded, current]);

  const focusInput = useCallback(() => {
    if (viewMode !== "typing") return;
    if (sessionEnded) {
      initialsInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [sessionEnded, viewMode]);

  useEffect(() => {
    focusInput();
  }, [focusInput, pointer]);

  const loadLeaderboard = useCallback(async () => {
    const rows = await fetchTodayKioskLeaderboard();
    setLeaderboard(rows);
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, LEADERBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  // Session countdown — a real time limit (distinct from the old per-
  // sentence pacing): typing flows continuously, sentence to sentence,
  // with no stop-and-see-your-WPM pause, until this hits zero — matching
  // how the regular app's own timed modes behave, per Customize Kiosk.
  // Depends only on the tick itself (not on typed/completedWordCountRef)
  // so completing a sentence never resets the 1s cadence. Doesn't start
  // ticking until the visitor's first keystroke, same as regular mode —
  // otherwise reading the prompt before typing eats into the time limit.
  useEffect(() => {
    if (sessionEnded || !hasStartedTyping) return;
    const timer = setTimeout(() => {
      setSessionSecondsLeft((s) => {
        if (s <= 1) {
          const rawWpm = Math.round(
            completedWordCountRef.current / (settings.sessionSeconds / 60)
          );
          setFinalWpm(Math.min(rawWpm, 250));
          setSessionEnded(true);
          playTimeUpChime();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [sessionSecondsLeft, sessionEnded, hasStartedTyping, settings.sessionSeconds]);

  const startNewSession = useCallback(() => {
    const freshSettings = loadKioskSettings();
    setSettings(freshSettings);
    setSessionSecondsLeft(freshSettings.sessionSeconds);
    setHasStartedTyping(false);
    setSessionEnded(false);
    setFinalWpm(0);
    completedWordCountRef.current = 0;
    setOrder(buildShuffledOrder(sentences.length));
    setPointer(0);
    setTyped("");
    setInitials("");
    setInitialsSubmitted(false);
  }, [sentences.length]);

  const handleChange = (e) => {
    if (sessionEnded) return;
    if (!hasStartedTyping) setHasStartedTyping(true);
    const value = e.target.value;
    if (value.length > current.text.length) return;
    setTyped(value);

    if (value === current.text) {
      const wordCount = current.text.trim().split(/\s+/).length;
      completedWordCountRef.current += wordCount;
      setTyped("");
      setPointer((prevPointer) => {
        const nextPointer = prevPointer + 1;
        if (nextPointer >= order.length) {
          setOrder(buildShuffledOrder(sentences.length, order[prevPointer]));
          return 0;
        }
        return nextPointer;
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") e.preventDefault();
  };

  const handleInitialsChange = (e) => {
    if (initialsSubmitted) return;
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, INITIALS_LENGTH);
    if (value.length === INITIALS_LENGTH && INITIALS_BLOCKLIST.includes(value)) {
      setInitials("");
      setInitialsRejected(true);
      setTimeout(() => setInitialsRejected(false), 1500);
      return;
    }
    setInitials(value);
  };

  useEffect(() => {
    if (!sessionEnded || initialsSubmitted || initials.length < INITIALS_LENGTH) return;
    setInitialsSubmitted(true);
    (async () => {
      await submitKioskScore({ initials, wpm: finalWpm });
      await loadLeaderboard();
    })();
  }, [sessionEnded, initials, initialsSubmitted, finalWpm, loadLeaderboard]);

  // Instructor-only entry removal: long-press the leaderboard title to
  // reveal a delete button per row (no login on a public kiosk, so this
  // stays a low-key gesture rather than a visible "admin" control).
  // Auto-exits after a bit so it's never left revealed for the next visitor.
  useEffect(() => {
    if (!manageMode) return;
    const timer = setTimeout(() => setManageMode(false), MANAGE_MODE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [manageMode]);

  const clearManageLongPress = () => {
    if (manageLongPressRef.current) {
      clearTimeout(manageLongPressRef.current);
      manageLongPressRef.current = null;
    }
  };

  const startManageLongPress = (e) => {
    e.stopPropagation();
    manageLongPressRef.current = setTimeout(() => setManageMode(true), MANAGE_LONG_PRESS_MS);
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    if (manageMode) setManageMode(false);
  };

  const handleDeleteEntry = async (e, id) => {
    e.stopPropagation();
    deleteKioskEntry(id);
    await loadLeaderboard();
  };

  return (
    <Screen onClick={focusInput}>
      <KioskGlobalStyle />
      <Banner>
        <BrandGroup>
          <svg viewBox="0 0 92 92" width="20" height="20" aria-hidden="true">
            <polygon
              points="30,18 62,18 78,46 62,74 30,74 14,46"
              fill="none"
              stroke="var(--btech-red)"
              strokeWidth="11"
              strokeLinejoin="miter"
            />
            <rect x="41.5" y="31" width="9" height="30" fill="currentColor" />
          </svg>
          <Wordmark>
            <strong>iter</strong>
            <em>verse</em>
          </Wordmark>{" "}
          <ProductName>Type</ProductName>
          <BrandDivider aria-hidden="true" />
          <BtechMark src={btechMark} alt="Bridgerland Technical College" />
        </BrandGroup>
        <BannerActions>
          <ModeToggle
            onClick={(e) => {
              e.stopPropagation();
              setViewMode(viewMode === "tap" ? "typing" : "tap");
            }}
          >
            {viewMode === "tap" ? "Typing Challenge" : "Tap Mode"}
          </ModeToggle>
          <ExitLink href="/">Exit kiosk mode</ExitLink>
        </BannerActions>
      </Banner>

      {viewMode === "tap" ? (
        <TapMode onExit={() => setViewMode("typing")} roundSeconds={settings.tapModeSeconds} />
      ) : (
      <Main>
        <HiddenInput
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Type the sentence shown above"
        />

        {sessionEnded ? (
          <SessionEndCard>
            <SessionEndMessage>Thanks for stopping by!</SessionEndMessage>
            <Wpm>{finalWpm} WPM</Wpm>

            {initialsSubmitted ? (
              <InitialsPrompt>You're on today's leaderboard!</InitialsPrompt>
            ) : (
              <>
                <InitialsRow>
                  {Array.from({ length: INITIALS_LENGTH }, (_, i) => (
                    <InitialsBox key={i} $filled={i < initials.length}>
                      {initials[i] || "_"}
                    </InitialsBox>
                  ))}
                </InitialsRow>
                <InitialsPrompt>
                  {initialsRejected
                    ? "Please choose different initials"
                    : "Enter your initials for today's leaderboard"}
                </InitialsPrompt>
                <HiddenInput
                  ref={initialsInputRef}
                  value={initials}
                  onChange={handleInitialsChange}
                  aria-label="Enter your initials for today's leaderboard"
                />
              </>
            )}

            <RestartButton onClick={(e) => { e.stopPropagation(); startNewSession(); }}>
              Start New Session
            </RestartButton>
          </SessionEndCard>
        ) : (
          <>
            <SessionTimer $urgent={hasStartedTyping && sessionSecondsLeft <= 10}>
              {formatTime(sessionSecondsLeft)}
            </SessionTimer>
            <Eyebrow>
              {settings.mode === "word" ? "Word practice" : current.topic || "Sentence practice"}
            </Eyebrow>
            <SentenceCard ref={sentenceCardRef}>
              {current.text.split("").map((char, i) => {
                const state =
                  i >= typed.length ? "pending" : typed[i] === char ? "correct" : "wrong";
                const pulse =
                  currentWordRange != null && i >= currentWordRange[0] && i < currentWordRange[1];
                return (
                  <Char
                    key={i}
                    data-char-index={i}
                    $state={state}
                    $isSpace={char === " "}
                    $pulse={pulse}
                  >
                    {char}
                  </Char>
                );
              })}
              {settings.pacingStyle !== "pulse" && (
                <Caret
                  $x={caretPos.x}
                  $y={caretPos.y}
                  $height={caretPos.height}
                  $visible={caretPos.visible}
                />
              )}
            </SentenceCard>
          </>
        )}
      </Main>
      )}

      {viewMode === "typing" && (
        <LeaderboardPanel>
          <LeaderboardTitle
            onPointerDown={startManageLongPress}
            onPointerUp={clearManageLongPress}
            onPointerLeave={clearManageLongPress}
            onClick={handleTitleClick}
          >
            Today's Top Typists
          </LeaderboardTitle>
          {leaderboard.length === 0 ? (
            <LeaderboardEmpty>No scores yet today — be the first!</LeaderboardEmpty>
          ) : (
            <LeaderboardList>
              {leaderboard.map((row, i) => (
                <LeaderboardRow key={row.id ?? i}>
                  <span><LeaderboardRank>{i + 1}.</LeaderboardRank>{row.user_name}</span>
                  <LeaderboardRowRight>
                    <span>{row.wpm} WPM</span>
                    {manageMode && (
                      <DeleteEntryButton
                        onClick={(e) => handleDeleteEntry(e, row.id)}
                        aria-label={`Remove ${row.user_name}'s score`}
                      >
                        ×
                      </DeleteEntryButton>
                    )}
                  </LeaderboardRowRight>
                </LeaderboardRow>
              ))}
            </LeaderboardList>
          )}
        </LeaderboardPanel>
      )}
    </Screen>
  );
};

export default KioskPage;
