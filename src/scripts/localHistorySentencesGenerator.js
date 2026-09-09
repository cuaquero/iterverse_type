import { LOCAL_HISTORY_SENTENCES } from "../constants/LocalHistorySentences";
import { randomIntFromRange } from "./randomUtils";

// Same shape as sentencesGenerator's output ({ val: "..." }) so SentenceBox
// can consume either source unchanged — this pulls from the Kiosk mode
// local-history pack (BTECH, Cache Valley, Box Elder County, Utah) instead
// of the generic English sentence bank.
const localHistorySentencesGenerator = (sentencesCount) => {
  const list = [];
  for (let i = 0; i < sentencesCount; i++) {
    const rand = randomIntFromRange(0, LOCAL_HISTORY_SENTENCES.length - 1);
    list.push({ val: LOCAL_HISTORY_SENTENCES[rand].text });
  }
  return list;
};

export { localHistorySentencesGenerator };
