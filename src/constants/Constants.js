const DEFAULT_WORDS_COUNT = 200;
const COUNT_DOWN_90 = 90;
const COUNT_DOWN_60 = 60;
const COUNT_DOWN_30 = 30;
const COUNT_DOWN_15 = 15;
const COUNT_DOWN_INFINITE = 0;
const DEFAULT_COUNT_DOWN = COUNT_DOWN_60;

const DEFAULT_DIFFICULTY = "normal";
const HARD_DIFFICULTY = "hard";
const NUMBER_ADDON = "+number";
const SYMBOL_ADDON = "+symbol";
const RESTART_BUTTON_TOOLTIP_TITLE = "[Tab] + [Enter] to quickly restart";
const REDO_BUTTON_TOOLTIP_TITLE = "[Tab] + [Space] to quickly redo";
const DEFAULT_DIFFICULTY_TOOLTIP_TITLE =
  "normal mode generates random words from top 1000 most frequently used words in English dataset.";
const HARD_DIFFICULTY_TOOLTIP_TITLE =
  "hard mode generates random words from blog posts words data, so you may encounter longer and less frequently used word.";
const NUMBER_ADDON_TOOLTIP_TITLE =
  "number mode generates word which contains random number";
const SYMBOL_ADDON_TOOLTIP_TITLE =
  "number mode generates word which contains random symbol";
const CHAR_TOOLTIP_TITLE =
  "correct/incorrect/missing/extra\n extras are recorded even if deleted.";
const SENTENCE_CHAR_TOOLTIP_TITLE = "correct/incorrect/extra\n";
const ENGLISH_MODE_TOOLTIP_TITLE = "English Mode";
const CHINESE_MODE_TOOLTIP_TITLE = "Chinese Pinyin Mode";
const DEFAULT_DIFFICULTY_TOOLTIP_TITLE_CHINESE =
  "normal mode generates random words from top 5000 most frequently used words in Chinese dataset.";
const HARD_DIFFICULTY_TOOLTIP_TITLE_CHINESE =
  "hard mode generates random words from top 1500 most used Chinese idioms.";

const ENGLISH_MODE = "ENGLISH_MODE";
const CHINESE_MODE = "CHINESE_MODE";

const GAME_MODE = "GAME_MODE";
const GAME_MODE_DEFAULT = "WORD_MODE";
const GAME_MODE_SENTENCE = "SENTENCE_MODE";
const WORD_MODE_LABEL = "word";
const SENTENCE_MODE_LABEL = "sentence";

const DEFAULT_SENTENCES_COUNT = 5;
const TEN_SENTENCES_COUNT = 10;
const FIFTEEN_SENTENCES_COUNT = 15;

const ENGLISH_SENTENCE_MODE_TOOLTIP_TITLE = "English Sentence Mode";
const CHINESE_SENTENCE_MODE_TOOLTIP_TITLE = "Chinese Sentence Mode";

const PACING_CARET = "caret";
const PACING_PULSE = "pulse";

const PACING_CARET_TOOLTIP =
  'type the word with a caret "|" , character by character.';
const PACING_PULSE_TOOLTIP =
  'type the word with a pulse "____", this helps improving wpm and your speed typing pace habit.';

const NUMBER_ADDON_KEY = "number";
const SYMBOL_ADDON_KEY = "symbol";

export {
  DEFAULT_WORDS_COUNT,
  DEFAULT_COUNT_DOWN,
  COUNT_DOWN_60,
  COUNT_DOWN_30,
  COUNT_DOWN_15,
  COUNT_DOWN_90,
  COUNT_DOWN_INFINITE,
  DEFAULT_DIFFICULTY,
  HARD_DIFFICULTY,
  NUMBER_ADDON,
  SYMBOL_ADDON,
  DEFAULT_DIFFICULTY_TOOLTIP_TITLE,
  HARD_DIFFICULTY_TOOLTIP_TITLE,
  NUMBER_ADDON_TOOLTIP_TITLE,
  SYMBOL_ADDON_TOOLTIP_TITLE,
  CHAR_TOOLTIP_TITLE,
  SENTENCE_CHAR_TOOLTIP_TITLE,
  ENGLISH_MODE,
  CHINESE_MODE,
  RESTART_BUTTON_TOOLTIP_TITLE,
  REDO_BUTTON_TOOLTIP_TITLE,
  ENGLISH_MODE_TOOLTIP_TITLE,
  CHINESE_MODE_TOOLTIP_TITLE,
  DEFAULT_DIFFICULTY_TOOLTIP_TITLE_CHINESE,
  HARD_DIFFICULTY_TOOLTIP_TITLE_CHINESE,
  GAME_MODE,
  GAME_MODE_DEFAULT,
  GAME_MODE_SENTENCE,
  WORD_MODE_LABEL,
  SENTENCE_MODE_LABEL,
  DEFAULT_SENTENCES_COUNT,
  TEN_SENTENCES_COUNT,
  FIFTEEN_SENTENCES_COUNT,
  ENGLISH_SENTENCE_MODE_TOOLTIP_TITLE,
  CHINESE_SENTENCE_MODE_TOOLTIP_TITLE,
  PACING_CARET,
  PACING_PULSE,
  PACING_CARET_TOOLTIP,
  PACING_PULSE_TOOLTIP,
  NUMBER_ADDON_KEY,
  SYMBOL_ADDON_KEY,
};
