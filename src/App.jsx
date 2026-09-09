import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "./style/theme";
import "./assets/iterverse/fonts.css";
import { GlobalStyles } from "./style/global";
import { LocaleProvider } from "./context/LocaleContext";
import Logo from "./components/common/Logo";
import FooterMenu from "./components/common/FooterMenu";
import {
  GAME_MODE,
  GAME_MODE_DEFAULT,
  GAME_MODE_SENTENCE,
  GAME_MODE_LOCAL,
} from "./constants/Constants";
import useLocalPersistState from "./hooks/useLocalPersistState";
import {
  SOUND_MODE,
  soundOptions,
  DEFAULT_SOUND_TYPE,
  DEFAULT_SOUND_TYPE_KEY,
} from "./components/features/sound/sound";
import TypeBox from "./components/features/TypeBox/TypeBox";
import SentenceBox from "./components/features/SentenceBox/SentenceBox";
import { generateSeed } from "./scripts/seedUtils";

const DefaultKeyboard = lazy(() => import("./components/features/Keyboard/DefaultKeyboard"));

function App() {
  // Every session gets a fresh seed for reproducible word/sentence generation.
  const [sessionSeed, setSessionSeed] = useState(() => generateSeed());

  const theme = defaultTheme;

  // local persist game mode setting
  const [soundMode, setSoundMode] = useLocalPersistState(false, SOUND_MODE);

  const [soundType, setSoundType] = useLocalPersistState(
    DEFAULT_SOUND_TYPE,
    DEFAULT_SOUND_TYPE_KEY
  );

  // local persist game mode setting
  const [gameMode, setGameMode] = useLocalPersistState(
    GAME_MODE_DEFAULT,
    GAME_MODE
  );

  const handleGameModeChange = (currGameMode) => {
    setGameMode(currGameMode);
  };

  // trainer mode setting
  const [isTrainerMode, setIsTrainerMode] = useState(false);

  const isWordGameMode = gameMode === GAME_MODE_DEFAULT && !isTrainerMode;
  const isSentenceGameMode = gameMode === GAME_MODE_SENTENCE && !isTrainerMode;
  const isLocalGameMode = gameMode === GAME_MODE_LOCAL && !isTrainerMode;

  const handleSoundTypeChange = (e) => {
    setSoundType(e.label);
  };

  const toggleSoundMode = () => {
    setSoundMode(!soundMode);
  };

  const toggleTrainerMode = () => {
    setIsTrainerMode(!isTrainerMode);
  };

  const textInputRef = useRef(null);
  const focusTextInput = () => {
    textInputRef.current && textInputRef.current.focus();
  };

  const textAreaRef = useRef(null);
  const focusTextArea = () => {
    textAreaRef.current && textAreaRef.current.focus();
  };

  const sentenceInputRef = useRef(null);
  const focusSentenceInput = () => {
    sentenceInputRef.current && sentenceInputRef.current.focus();
  };

  useEffect(() => {
    if (isWordGameMode) {
      focusTextInput();
      return;
    }
    if (isSentenceGameMode || isLocalGameMode) {
      focusSentenceInput();
      return;
    }
    return;
  }, [theme, isWordGameMode, isSentenceGameMode, isLocalGameMode, soundMode, soundType]);

  return (
    <LocaleProvider>
    <ThemeProvider theme={theme}>
      <>
        <div className="canvas">
          <GlobalStyles />
          <Logo></Logo>
          {isWordGameMode && (
            <TypeBox
              textInputRef={textInputRef}
              soundMode={soundMode}
              theme={theme}
              soundType={soundType}
              handleInputFocus={() => focusTextInput()}
              sessionSeed={sessionSeed}
              setSessionSeed={setSessionSeed}
            ></TypeBox>
          )}
          {isSentenceGameMode && (
            <SentenceBox
              sentenceInputRef={sentenceInputRef}
              soundMode={soundMode}
              soundType={soundType}
              key="sentence-box"
              handleInputFocus={() => focusSentenceInput()}
            ></SentenceBox>
          )}
          {isLocalGameMode && (
            <SentenceBox
              sentenceInputRef={sentenceInputRef}
              soundMode={soundMode}
              soundType={soundType}
              key="local-history-box"
              contentSource="local"
              handleInputFocus={() => focusSentenceInput()}
            ></SentenceBox>
          )}
          <Suspense fallback={null}>
            {isTrainerMode && (
              <DefaultKeyboard
                soundMode={soundMode}
                soundType={soundType}
              ></DefaultKeyboard>
            )}
          </Suspense>
          <div className="bottomBar">
            <FooterMenu
              soundMode={soundMode}
              toggleSoundMode={toggleSoundMode}
              soundOptions={soundOptions}
              soundType={soundType}
              handleSoundTypeChange={handleSoundTypeChange}
              gameMode={gameMode}
              handleGameModeChange={handleGameModeChange}
              isTrainerMode={isTrainerMode}
              toggleTrainerMode={toggleTrainerMode}
            ></FooterMenu>
          </div>
        </div>
      </>
    </ThemeProvider>
    </LocaleProvider>
  );
}

export default App;
