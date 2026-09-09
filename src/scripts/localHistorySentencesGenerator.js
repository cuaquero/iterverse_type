import { randomIntFromRange } from "./randomUtils";

// Same shape as sentencesGenerator's output ({ val: "..." }) so SentenceBox
// can consume either source unchanged — this pulls from the shared
// content-sources pool (BTECH, Cache Valley, Box Elder County, Utah)
// instead of the generic English sentence bank. `sentences` is the live
// list (src/services/contentAdmin.js's fetchContentSources) rather than a
// static import, so an instructor's /admin edits show up here without a
// code change.
const localHistorySentencesGenerator = (sentencesCount, sentences) => {
  const list = [];
  for (let i = 0; i < sentencesCount; i++) {
    const rand = randomIntFromRange(0, sentences.length - 1);
    list.push({ val: sentences[rand].text });
  }
  return list;
};

export { localHistorySentencesGenerator };
