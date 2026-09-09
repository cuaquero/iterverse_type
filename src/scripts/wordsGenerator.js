import { wordList as hardWordList } from "random-words";
import { COMMON_WORDS } from "../constants/WordsMostCommon";
import { DEFAULT_DIFFICULTY, HARD_DIFFICULTY } from "../constants/Constants";
import { randomIntFromRange } from "./randomUtils";
import {
  generateRandomNumChras,
  generateRandomSymbolChras,
} from "./randomCharsGenerator";

// hard — select from random-words wordList with seeded RNG for determinism
const HARD_ENGLISH_WORDS = hardWordList.filter((w) => w.length <= 7);

// Draw indices against bank.length - 1 so the bound always stays in sync
// with the selected word bank. Swapping a word list only requires updating
// this map — nothing else.
const WORD_BANK_BY_DIFFICULTY = {
  [DEFAULT_DIFFICULTY]: COMMON_WORDS,
  [HARD_DIFFICULTY]: HARD_ENGLISH_WORDS,
};

const generateWordsFromBank = (bank, count, numberAddOn, symbolAddOn, rng) => {
  const wordList = [];
  const bankLength = bank.length;
  for (let i = 0; i < count; i++) {
    const rand = randomIntFromRange(0, bankLength - 1, rng);
    const entry = bank[rand];
    // guard against sparse banks — the draw range stays within bank.length,
    // so this only fires when a bank entry itself is missing/empty
    if (!entry) {
      continue;
    }
    // banks store either { key, val } objects (vocab JSON) or plain strings
    // (random-words wordList) — normalize both to { key, val }
    let wordCandidateKey =
      typeof entry === "string" ? entry : entry.key;
    let wordCandidateVal =
      typeof entry === "string" ? entry : entry.val;
    if (!wordCandidateKey || !wordCandidateVal) {
      continue;
    }
    if (numberAddOn) {
      const generatedNumber = generateRandomNumChras(1, 2, rng);
      wordCandidateKey = wordCandidateKey + generatedNumber;
      wordCandidateVal = wordCandidateVal + generatedNumber;
    }
    if (symbolAddOn) {
      const generatedSymbol = generateRandomSymbolChras(1, 1, rng);
      wordCandidateKey = wordCandidateKey + generatedSymbol;
      wordCandidateVal = wordCandidateVal + generatedSymbol;
    }

    wordList.push({
      key: wordCandidateKey,
      val: wordCandidateVal,
    });
  }

  return wordList;
};

const wordsGenerator = (
  wordsCount,
  difficulty,
  numberAddOn,
  symbolAddOn,
  rng
) => {
  return generateWordsFromBank(
    WORD_BANK_BY_DIFFICULTY[difficulty],
    wordsCount,
    numberAddOn,
    symbolAddOn,
    rng
  );
};

export { wordsGenerator };
