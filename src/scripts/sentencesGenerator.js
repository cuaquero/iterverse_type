import { ENGLISH_SENTENCES } from "../constants/SentencesCollection";
import { randomIntFromRange } from "./randomUtils";

const sentencesGenerator = (sentencesCount) => {
  const EnglishSentencesList = [];
  for (let i = 0; i < sentencesCount; i++) {
    const rand = randomIntFromRange(0, 50);
    EnglishSentencesList.push(ENGLISH_SENTENCES[rand]);
  }
  return EnglishSentencesList;
};

export { sentencesGenerator };
