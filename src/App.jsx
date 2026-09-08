import React, { useState, useRef, useEffect, useMemo, lazy, Suspense } from "react";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "./style/theme";
import { resolveTheme } from "./style/customThemes";
import {
  parseCustomWordsText,
  resolveActiveCustomList,
} from "./scripts/customWords";
import { GlobalStyles } from "./style/global";
import { LocaleProvider } from "./context/LocaleContext";
import Logo from "./components/common/Logo";
import FooterMenu from "./components/common/FooterMenu";
import CustomWordsEditor from "./components/features/CustomWords/CustomWordsEditor";
import useCustomWordsEditor from "./hooks/useCustomWordsEditor";
import {
  GAME_MODE,
  GAME_MODE_DEFAULT,
  GAME_MODE_SENTENCE,
} from "./constants/Constants";
import useLocalPersistState from "./hooks/useLocalPersistState";
import {
  SOUND_MODE,
  soundOptions,
  DEFAULT_SOUND_TYPE,
  DEFAULT_SOUND_TYPE_KEY,
} from "./components/features/sound/sound";
import DynamicBackground from "./components/common/DynamicBackground";
import TypeBox from "./components/features/TypeBox/TypeBox";
import SentenceBox from "./components/features/SentenceBox/SentenceBox";
import { generateSeed } from "./scripts/seedUtils";

const DefaultKeyboard = lazy(() => import("./components/features/Keyboard/DefaultKeyboard"));

function App() {
  // Every session gets a fresh seed for reproducible word/sentence generation.
  const [sessionSeed, setSessionSeed] = useState(() => generateSeed());

  // Active theme, resolved against the built-in theme list on load.
  const [theme, setTheme] = useState(() => {
    const raw = window.localStorage.getItem("theme");
    if (raw == null) return defaultTheme;
    try {
      return resolveTheme(JSON.parse(raw));
    } catch {
      return defaultTheme;
    }
  });

  // Custom word lists (blogger-friendly: define your own demo words so the test
  // doesn't surface random vocab during a recording).
  const {
    customWordLists,
    activeListId,
    editorOpen: wordsEditorOpen,
    editorMode: wordsEditorMode,
    draft: wordsDraft,
    openEditorForNew: openWordsEditorForNew,
    openEditorForId: openWordsEditorForId,
    activateList: activateWordsList,
    deactivateList: deactivateWordsList,
    handleEditorChange: handleWordsEditorChange,
    handleEditorSave: handleWordsEditorSave,
    handleEditorCancel: handleWordsEditorCancel,
    handleEditorDelete: handleWordsEditorDelete,
  } = useCustomWordsEditor();

  const activeCustomList = useMemo(
    () => resolveActiveCustomList(customWordLists, activeListId),
    [customWordLists, activeListId]
  );

  const customWordsOverride = useMemo(() => {
    if (!activeCustomList) return null;
    const parsed = parseCustomWordsText(activeCustomList);
    if (parsed.length === 0) return null;
    return {
      language: activeCustomList.language,
      parsed,
      listName: activeCustomList.name,
    };
  }, [activeCustomList]);

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

  const handleThemeChange = (e) => {
    window.localStorage.setItem("theme", JSON.stringify(e.value));
    setTheme(e.value);
  };

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
    if (isSentenceGameMode) {
      focusSentenceInput();
      return;
    }
    return;
  }, [theme, isWordGameMode, isSentenceGameMode, soundMode, soundType]);

  return (
    <LocaleProvider>
    <ThemeProvider theme={theme}>
      <>
        <DynamicBackground theme={theme}></DynamicBackground>
        <div className="canvas">
          <GlobalStyles />
          <Logo></Logo>
          {isWordGameMode && (
            <TypeBox
              textInputRef={textInputRef}
              soundMode={soundMode}
              theme={theme}
              soundType={soundType}
              // Re-mount TypeBox when the active custom list changes so it
              // re-initialises wordsDict from the new source on first render.
              key={`type-box-${activeListId || "default"}`}
              handleInputFocus={() => focusTextInput()}
              sessionSeed={sessionSeed}
              setSessionSeed={setSessionSeed}
              customWordsOverride={customWordsOverride}
              onClearCustomWords={deactivateWordsList}
              onCreateWordList={openWordsEditorForNew}
              onEditWordList={openWordsEditorForId}
              hasActiveWordList={!!activeListId}
              customWordLists={customWordLists}
              activeWordListId={activeListId}
              onActivateWordList={activateWordsList}
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
              theme={theme}
              soundMode={soundMode}
              toggleSoundMode={toggleSoundMode}
              soundOptions={soundOptions}
              soundType={soundType}
              handleSoundTypeChange={handleSoundTypeChange}
              handleThemeChange={handleThemeChange}
              gameMode={gameMode}
              handleGameModeChange={handleGameModeChange}
              isTrainerMode={isTrainerMode}
              toggleTrainerMode={toggleTrainerMode}
            ></FooterMenu>
          </div>
          <CustomWordsEditor
            open={wordsEditorOpen}
            draft={wordsDraft}
            onChange={handleWordsEditorChange}
            onSave={handleWordsEditorSave}
            onCancel={handleWordsEditorCancel}
            onDelete={handleWordsEditorDelete}
            isExisting={wordsEditorMode === "edit"}
            existingNames={customWordLists
              .filter((l) => wordsEditorMode !== "edit" || l.id !== wordsDraft?.id)
              .map((l) => l.name)}
          />
        </div>
      </>
    </ThemeProvider>
    </LocaleProvider>
  );
}

export default App;
