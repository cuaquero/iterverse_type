import EnglishMostFrequentWords from '../assets/Vocab/EnglishMostFrequentWords.json';

// The JSON vocab file is a keyed object ({"0": {...}, ...}) rather than an
// array — normalize to a plain array so consumers can rely on .length.
const COMMON_WORDS = Object.values(EnglishMostFrequentWords);

export {
    COMMON_WORDS
}
