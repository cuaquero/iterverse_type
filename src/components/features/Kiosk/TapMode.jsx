/**
 * TapMode — a simplified, timed key-mashing game for kiosk visitors who
 * want something lighter than the full typing challenge (young kids,
 * students with special needs, or anyone just passing by).
 *
 * Repurposes the same mechanic as the main app's QWERTY Trainer mode
 * (src/components/features/Keyboard/DefaultKeyboard.jsx): press the
 * highlighted key. No sentences to read, no leaderboard, no accuracy
 * grading — a fixed-length round that always ends on an encouraging note
 * regardless of how it went, so nobody "loses."
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

const ROUND_SECONDS = 45;

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];
const ALL_KEYS = [...ROWS.flat(), " "];

const ENCOURAGEMENTS = [
  "Great job!",
  "You're a typing star!",
  "Awesome work!",
  "Nice typing!",
  "You did it!",
  "Way to go!",
];

function pickNextKey(current) {
  let next = ALL_KEYS[Math.floor(Math.random() * ALL_KEYS.length)];
  if (next === current) {
    next = ALL_KEYS[(ALL_KEYS.indexOf(current) + 1) % ALL_KEYS.length];
  }
  return next;
}

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const Wrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-4);
  text-align: center;
`;

const Timer = styled.div`
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  color: var(--text-body);
  font-variant-numeric: tabular-nums;
`;

const Prompt = styled.div`
  font-size: var(--fs-base);
  color: var(--text-muted);
`;

const KeyboardWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
`;

const Row = styled.div`
  display: flex;
  gap: var(--space-2);
`;

const keyBackground = ({ $target, $flash }) => {
  if ($flash === "correct") return "var(--color-success)";
  if ($flash === "wrong") return "var(--color-danger)";
  if ($target) return "var(--color-brand)";
  return "var(--neutral-700)";
};

const Key = styled.div`
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-md);
  font-weight: var(--fw-bold);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: ${keyBackground};
  color: ${({ $target, $flash }) => ($target || $flash ? "var(--white)" : "var(--text-body)")};
  transition: background var(--dur-fast) var(--ease-standard);
  animation: ${({ $target }) => ($target ? pulse : "none")} 0.8s ease-in-out infinite;
`;

const SpaceKey = styled(Key)`
  width: 14rem;
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
`;

const EndCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
`;

const EndMessage = styled.div`
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: var(--fw-bold);
  color: var(--text-body);
`;

const EndSub = styled.div`
  font-size: var(--fs-md);
  color: var(--text-body);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
`;

const Button = styled.button`
  padding: var(--space-3) var(--space-6);
  font-size: var(--fs-md);
  font-family: var(--font-sans);
  font-weight: var(--fw-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-standard);
  background: ${({ $variant }) => ($variant === "ghost" ? "var(--surface-subtle)" : "var(--color-brand)")};
  color: ${({ $variant }) => ($variant === "ghost" ? "var(--text-body)" : "var(--white)")};
  &:hover {
    background: ${({ $variant }) => ($variant === "ghost" ? "var(--border-subtle)" : "var(--color-brand-hover)")};
  }
`;

const TapMode = ({ onExit }) => {
  const [targetKey, setTargetKey] = useState(() => pickNextKey(null));
  const [flash, setFlash] = useState(null); // { key, state }
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [phase, setPhase] = useState("playing");
  const [message] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  const inputRef = useRef(null);
  const flashTimerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (secondsLeft <= 0) {
      setPhase("done");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const showFlash = useCallback((key, state) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlash({ key, state });
    flashTimerRef.current = setTimeout(() => setFlash(null), 150);
  }, []);

  const handleKeyDown = (e) => {
    if (phase !== "playing") return;
    e.preventDefault();
    const pressed = e.key === " " ? " " : e.key.toUpperCase();
    if (pressed === targetKey) {
      setCorrectCount((c) => c + 1);
      showFlash(pressed, "correct");
      setTargetKey((prev) => pickNextKey(prev));
    } else if (ALL_KEYS.includes(pressed)) {
      showFlash(pressed, "wrong");
    }
  };

  const playAgain = () => {
    setSecondsLeft(ROUND_SECONDS);
    setCorrectCount(0);
    setTargetKey(pickNextKey(null));
    setFlash(null);
    setPhase("playing");
  };

  const keyState = (letter) => {
    const isTarget = letter === targetKey;
    const isFlashed = flash?.key === letter;
    return {
      $target: isTarget && !isFlashed,
      $flash: isFlashed ? flash.state : null,
    };
  };

  if (phase === "done") {
    return (
      <Wrap>
        <EndCard>
          <EndMessage>{message}</EndMessage>
          <EndSub>You pressed {correctCount} keys.</EndSub>
          <ButtonRow>
            <Button onClick={playAgain}>Play Again</Button>
            <Button $variant="ghost" onClick={onExit}>
              Back to Typing Challenge
            </Button>
          </ButtonRow>
        </EndCard>
      </Wrap>
    );
  }

  return (
    <Wrap onClick={() => inputRef.current?.focus()}>
      <HiddenInput
        ref={inputRef}
        onKeyDown={handleKeyDown}
        autoFocus
        aria-label="Press the highlighted key"
      />
      <Timer>{secondsLeft}s</Timer>
      <KeyboardWrap>
        {ROWS.map((row, i) => (
          <Row key={i}>
            {row.map((letter) => (
              <Key key={letter} {...keyState(letter)}>
                {letter}
              </Key>
            ))}
          </Row>
        ))}
        <Row>
          <SpaceKey {...keyState(" ")} />
        </Row>
      </KeyboardWrap>
      <Prompt>Press the glowing key!</Prompt>
    </Wrap>
  );
};

export default TapMode;
