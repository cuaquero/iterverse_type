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
import styled, { createGlobalStyle } from "styled-components";
import "../assets/iterverse/tokens.css";
import "../assets/iterverse/fonts.css";
import { submitKioskScore, fetchTodayKioskLeaderboard } from "../services/leaderboard";
import TapMode from "../components/features/Kiosk/TapMode";
import { loadKioskSettings, buildSentencePool, buildWordPool } from "../services/kioskSettings";

const LEADERBOARD_REFRESH_MS = 20000;
const INITIALS_LENGTH = 3;
const BANNER_HEIGHT = "64px";

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
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-muted);
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
  const sentences = useMemo(
    () => (settings.mode === "word" ? buildWordPool() : buildSentencePool(settings.sources)),
    [settings]
  );
  const [order, setOrder] = useState(() => buildShuffledOrder(sentences.length));
  const [pointer, setPointer] = useState(0);
  const [typed, setTyped] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [initials, setInitials] = useState("");
  const [initialsSubmitted, setInitialsSubmitted] = useState(false);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(settings.sessionSeconds);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalWpm, setFinalWpm] = useState(0);
  const inputRef = useRef(null);
  const initialsInputRef = useRef(null);
  const sentenceCardRef = useRef(null);
  const completedWordCountRef = useRef(0);
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0, height: 0, visible: false });

  const current = sentences[order[pointer]];

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
  // so completing a sentence never resets the 1s cadence.
  useEffect(() => {
    if (sessionEnded) return;
    const timer = setTimeout(() => {
      setSessionSecondsLeft((s) => {
        if (s <= 1) {
          const rawWpm = Math.round(
            completedWordCountRef.current / (settings.sessionSeconds / 60)
          );
          setFinalWpm(Math.min(rawWpm, 250));
          setSessionEnded(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [sessionSecondsLeft, sessionEnded, settings.sessionSeconds]);

  const startNewSession = useCallback(() => {
    const freshSettings = loadKioskSettings();
    setSettings(freshSettings);
    setSessionSecondsLeft(freshSettings.sessionSeconds);
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
        </BrandGroup>
        <BannerActions>
          {viewMode === "typing" && !sessionEnded && (
            <SessionTimer>{formatTime(sessionSecondsLeft)}</SessionTimer>
          )}
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
        <TapMode onExit={() => setViewMode("typing")} />
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
                <InitialsPrompt>Enter your initials for today's leaderboard</InitialsPrompt>
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
            <Eyebrow>
              {settings.mode === "word" ? "Word practice" : current.topic || "Sentence practice"}
            </Eyebrow>
            <SentenceCard ref={sentenceCardRef}>
              {current.text.split("").map((char, i) => {
                const state =
                  i >= typed.length ? "pending" : typed[i] === char ? "correct" : "wrong";
                return (
                  <Char key={i} data-char-index={i} $state={state} $isSpace={char === " "}>
                    {char}
                  </Char>
                );
              })}
              <Caret
                $x={caretPos.x}
                $y={caretPos.y}
                $height={caretPos.height}
                $visible={caretPos.visible}
              />
            </SentenceCard>
          </>
        )}
      </Main>
      )}

      {viewMode === "typing" && (
        <LeaderboardPanel>
          <LeaderboardTitle>Today's Top Typists</LeaderboardTitle>
          {leaderboard.length === 0 ? (
            <LeaderboardEmpty>No scores yet today — be the first!</LeaderboardEmpty>
          ) : (
            <LeaderboardList>
              {leaderboard.map((row, i) => (
                <LeaderboardRow key={i}>
                  <span><LeaderboardRank>{i + 1}.</LeaderboardRank>{row.user_name}</span>
                  <span>{row.wpm} WPM</span>
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
