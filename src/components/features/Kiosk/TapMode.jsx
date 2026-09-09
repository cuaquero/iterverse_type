/**
 * TapMode — a simplified, timed key-mashing game for kiosk visitors who
 * want something lighter than the full typing challenge (young kids,
 * students with special needs, or anyone just passing by).
 *
 * Repurposes the same mechanic as the main app's QWERTY Trainer mode
 * (src/components/features/Keyboard/DefaultKeyboard.jsx): press the
 * highlighted key. No sentences to read, no leaderboard, no accuracy
 * grading — a round that always ends on an encouraging note regardless of
 * how it went, so nobody "loses." Round length comes from the `roundSeconds`
 * prop (staff-configurable via Customize Kiosk Session). Every correct press
 * showers a few copies of that letter down the screen for a bit of visual
 * feedback beyond the key flash.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { playTimeUpChime } from "../../../services/chime";

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

const rain = keyframes`
  from { top: -10%; opacity: 1; }
  85% { opacity: 1; }
  to { top: 110%; opacity: 0; }
`;

const Wrap = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1.5rem, 4vh, 3rem);
  padding: var(--space-8) var(--space-4);
  text-align: center;
`;

const RainLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const Raindrop = styled.span`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: -10%;
  transform: translateX(-50%);
  font-size: ${({ $size }) => $size}rem;
  font-weight: var(--fw-bold);
  color: var(--color-success);
  animation: ${rain} ${({ $duration }) => $duration}s linear forwards;
  animation-delay: ${({ $delay }) => $delay}s;
`;

const Timer = styled.div`
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  font-weight: var(--fw-bold);
  color: var(--text-body);
  font-variant-numeric: tabular-nums;
`;

const Prompt = styled.div`
  font-size: clamp(1.25rem, 2.6vw, 2rem);
  color: var(--text-muted);
`;

const KeyboardWrap = styled.div`
  --key-size: clamp(3.5rem, min(7.5vw, 11vh), 7.5rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.5rem, 1.4vh, 1rem);
`;

const Row = styled.div`
  display: flex;
  gap: clamp(0.5rem, 1.2vw, 1rem);
`;

const keyBackground = ({ $target, $flash }) => {
  if ($flash === "correct") return "var(--color-success)";
  if ($flash === "wrong") return "var(--color-danger)";
  if ($target) return "var(--color-brand)";
  return "var(--neutral-700)";
};

const Key = styled.div`
  width: var(--key-size);
  height: var(--key-size);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.5rem, min(3.2vw, 4.5vh), 3rem);
  font-weight: var(--fw-bold);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: ${keyBackground};
  color: ${({ $target, $flash }) => ($target || $flash ? "var(--white)" : "var(--text-body)")};
  transition: background var(--dur-fast) var(--ease-standard);
  animation: ${({ $target }) => ($target ? pulse : "none")} 0.8s ease-in-out infinite;
`;

const SpaceKey = styled(Key)`
  width: calc(var(--key-size) * 5.2);
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
  font-size: clamp(2.25rem, 5.5vw, 3.75rem);
  font-weight: var(--fw-bold);
  color: var(--text-body);
`;

const EndSub = styled.div`
  font-size: clamp(1.25rem, 2.6vw, 1.75rem);
  color: var(--text-body);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
`;

const Button = styled.button`
  padding: var(--space-4) var(--space-8);
  font-size: clamp(1.1rem, 2.2vw, 1.5rem);
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

const TapMode = ({ onExit, roundSeconds = 30 }) => {
  const [targetKey, setTargetKey] = useState(() => pickNextKey(null));
  const [flash, setFlash] = useState(null); // { key, state }
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [phase, setPhase] = useState("playing");
  const [message] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  const [raindrops, setRaindrops] = useState([]);
  const inputRef = useRef(null);
  const flashTimerRef = useRef(null);
  const rainIdRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  // Doesn't start ticking until the first keypress, same as the main
  // Typing Challenge and regular mode — otherwise reading the keyboard
  // before playing eats into the round.
  useEffect(() => {
    if (phase !== "playing" || !hasStarted) return;
    if (secondsLeft <= 0) {
      setPhase("done");
      playTimeUpChime();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft, hasStarted]);

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

  const spawnRain = useCallback((letter) => {
    const glyph = letter === " " ? "_" : letter;
    const drops = Array.from({ length: 10 }, () => {
      rainIdRef.current += 1;
      return {
        id: rainIdRef.current,
        glyph,
        x: 5 + Math.random() * 90,
        size: 1.25 + Math.random() * 1.5,
        duration: 0.9 + Math.random() * 0.7,
        delay: Math.random() * 0.2,
      };
    });
    setRaindrops((prev) => [...prev, ...drops]);
    const lifespan = Math.max(...drops.map((d) => d.duration + d.delay)) * 1000 + 100;
    const ids = new Set(drops.map((d) => d.id));
    setTimeout(() => {
      setRaindrops((prev) => prev.filter((d) => !ids.has(d.id)));
    }, lifespan);
  }, []);

  const handleKeyDown = (e) => {
    if (phase !== "playing") return;
    e.preventDefault();
    if (!hasStarted) setHasStarted(true);
    const pressed = e.key === " " ? " " : e.key.toUpperCase();
    if (pressed === targetKey) {
      setCorrectCount((c) => c + 1);
      showFlash(pressed, "correct");
      spawnRain(pressed);
      setTargetKey((prev) => pickNextKey(prev));
    } else if (ALL_KEYS.includes(pressed)) {
      showFlash(pressed, "wrong");
    }
  };

  const playAgain = () => {
    setSecondsLeft(roundSeconds);
    setHasStarted(false);
    setCorrectCount(0);
    setTargetKey(pickNextKey(null));
    setFlash(null);
    setRaindrops([]);
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
      <RainLayer>
        {raindrops.map((d) => (
          <Raindrop key={d.id} $x={d.x} $size={d.size} $duration={d.duration} $delay={d.delay}>
            {d.glyph}
          </Raindrop>
        ))}
      </RainLayer>
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
