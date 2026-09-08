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
import btechLogo from "../assets/iterverse/logo-horizontal.png";
import LOCAL_HISTORY_SENTENCES from "../constants/LocalHistorySentences";
import { submitKioskScore, fetchTodayKioskLeaderboard } from "../services/leaderboard";

const AUTO_ADVANCE_MS = 8000;
const POST_SUBMIT_ADVANCE_MS = 2500;
const LEADERBOARD_REFRESH_MS = 20000;
const INITIALS_LENGTH = 3;
const BANNER_HEIGHT = "64px";

const KioskGlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    margin: 0;
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
  background: var(--surface-card);
  border-bottom: 1px solid var(--border-subtle);

  @media (max-width: 480px) {
    padding: var(--space-2) var(--space-3);
  }
`;

const BrandGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
`;

const Wordmark = styled.span`
  font-size: var(--fs-lg);
  line-height: 1;
  letter-spacing: -0.015em;
  strong {
    font-weight: var(--fw-bold);
    color: var(--btech-red);
  }
  em {
    font-style: normal;
    font-weight: 300;
    color: var(--neutral-600);
  }
`;

const Divider = styled.div`
  width: 1px;
  align-self: stretch;
  margin: var(--space-2) 0;
  background: var(--border-default);

  @media (max-width: 480px) {
    display: none;
  }
`;

const BtechLogo = styled.img`
  height: 28px;
  width: auto;

  @media (max-width: 480px) {
    display: none;
  }
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
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-muted);
`;

const SentenceCard = styled.div`
  max-width: min(90vw, 1000px);
  font-size: clamp(1.5rem, 3.4vw, 2.5rem);
  font-weight: var(--fw-medium);
  line-height: var(--lh-normal);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
`;

const Char = styled.span`
  color: ${({ $state }) =>
    $state === "correct"
      ? "var(--color-success)"
      : $state === "wrong"
      ? "var(--color-danger)"
      : "var(--text-muted)"};
  text-decoration: ${({ $state }) => ($state === "wrong" ? "underline" : "none")};
  white-space: pre-wrap;
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
`;

const Prompt = styled.div`
  font-size: var(--fs-base);
  color: var(--text-muted);
`;

const ResultCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
`;

const Wpm = styled.div`
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: var(--fw-bold);
  color: var(--btech-gray);
`;

const TopicBadge = styled.div`
  font-size: var(--fs-sm);
  color: var(--text-body);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  strong {
    color: var(--btech-red);
    font-weight: var(--fw-bold);
  }
`;

const NextButton = styled.button`
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--fs-md);
  font-family: var(--font-sans);
  font-weight: var(--fw-medium);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: var(--white);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-standard);
  &:hover {
    background: var(--color-brand-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
`;

const LeaderboardPanel = styled.div`
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  width: min(240px, calc(100vw - 2 * var(--space-4)));
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
  text-align: left;
  z-index: 10;
`;

const LeaderboardTitle = styled.div`
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--btech-gray);
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
  color: ${({ $filled }) => ($filled ? "var(--btech-gray)" : "var(--border-default)")};
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
`;

const InitialsPrompt = styled.div`
  font-size: var(--fs-sm);
  color: var(--text-muted);
`;

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
  const sentences = useMemo(() => LOCAL_HISTORY_SENTENCES, []);
  const [order, setOrder] = useState(() => buildShuffledOrder(sentences.length));
  const [pointer, setPointer] = useState(0);
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [initials, setInitials] = useState("");
  const [initialsSubmitted, setInitialsSubmitted] = useState(false);
  const inputRef = useRef(null);
  const initialsInputRef = useRef(null);
  const advanceTimerRef = useRef(null);

  const current = sentences[order[pointer]];

  const focusInput = useCallback(() => {
    if (finished) {
      initialsInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [finished]);

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

  const goToNext = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setTyped("");
    setStartTime(null);
    setFinished(false);
    setInitials("");
    setInitialsSubmitted(false);
    setPointer((prevPointer) => {
      const nextPointer = prevPointer + 1;
      if (nextPointer >= order.length) {
        setOrder(buildShuffledOrder(sentences.length, order[prevPointer]));
        return 0;
      }
      return nextPointer;
    });
  }, [order, sentences.length]);

  const handleChange = (e) => {
    if (finished) return;
    const value = e.target.value;
    if (startTime == null && value.length > 0) {
      setStartTime(Date.now());
    }
    if (value.length > current.text.length) return;
    setTyped(value);

    if (value === current.text) {
      const elapsedMs = Math.max(Date.now() - (startTime ?? Date.now()), 1000);
      const wordCount = current.text.trim().split(/\s+/).length;
      const rawWpm = Math.round(wordCount / (elapsedMs / 60000));
      setWpm(Math.min(rawWpm, 250));
      setFinished(true);
      advanceTimerRef.current = setTimeout(goToNext, AUTO_ADVANCE_MS);
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
    if (!finished || initialsSubmitted || initials.length < INITIALS_LENGTH) return;
    setInitialsSubmitted(true);
    (async () => {
      await submitKioskScore({ initials, wpm });
      await loadLeaderboard();
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(goToNext, POST_SUBMIT_ADVANCE_MS);
    })();
  }, [finished, initials, initialsSubmitted, wpm, goToNext, loadLeaderboard]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  return (
    <Screen onClick={focusInput}>
      <KioskGlobalStyle />
      <Banner>
        <BrandGroup>
          <svg viewBox="0 0 92 92" width="28" height="28" aria-hidden="true">
            <polygon
              points="30,18 62,18 78,46 62,74 30,74 14,46"
              fill="none"
              stroke="var(--btech-red)"
              strokeWidth="11"
              strokeLinejoin="miter"
            />
            <rect x="41.5" y="31" width="9" height="30" fill="var(--btech-gray)" />
          </svg>
          <Wordmark>
            <strong>iter</strong>
            <em>verse</em>
          </Wordmark>
          <Divider />
          <BtechLogo src={btechLogo} alt="Bridgerland Technical College" />
        </BrandGroup>
        <ExitLink href="/">Exit kiosk mode</ExitLink>
      </Banner>

      <Main>
        <HiddenInput
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Type the sentence shown above"
        />

        {!finished ? (
          <>
            <Eyebrow>Typing challenge — local history edition</Eyebrow>
            <SentenceCard>
              {current.text.split("").map((char, i) => {
                const state =
                  i >= typed.length ? "pending" : typed[i] === char ? "correct" : "wrong";
                return (
                  <Char key={i} $state={state}>
                    {char}
                  </Char>
                );
              })}
            </SentenceCard>
            <Prompt>Start typing on the keyboard — no login required.</Prompt>
          </>
        ) : (
          <ResultCard>
            <Eyebrow>Nice work.</Eyebrow>
            <Wpm>{wpm} WPM</Wpm>
            <TopicBadge>
              <strong>Did you know?</strong> {current.topic}
            </TopicBadge>

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

            <NextButton
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              Next sentence
            </NextButton>
          </ResultCard>
        )}
      </Main>

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
    </Screen>
  );
};

export default KioskPage;
