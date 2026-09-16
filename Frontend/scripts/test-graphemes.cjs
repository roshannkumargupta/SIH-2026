const assert = require("assert");

function getGraphemes(word, lang = "en") {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(lang, { granularity: "grapheme" });
      return Array.from(segmenter.segment(word), (s) => s.segment);
    } catch {
      // Fallback
    }
  }
  return word.split("");
}

function scrambleWord(word, lang = "en") {
  const graphemes = getGraphemes(word, lang);
  if (graphemes.length <= 1) return word;

  let scrambled;
  let attempts = 0;
  do {
    const arr = [...graphemes];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    scrambled = arr.join("");
    attempts++;
  } while (scrambled === word && graphemes.length > 2 && attempts < 10);

  return scrambled;
}

// Test 1: Assamese test word
const assameseWord = "কাজিৰঙা";
const assameseClusters = getGraphemes(assameseWord, "as");
console.log("Assamese clusters for 'কাজিৰঙা':", assameseClusters);
assert.deepStrictEqual(assameseClusters, ["কা", "জি", "ৰ", "ঙা"]);

// Unscrambled (sorted) must equal original sorted
const scrambled = scrambleWord(assameseWord, "as");
console.log("Scrambled Assamese word:", scrambled);
const unscrambled = getGraphemes(scrambled, "as").sort().join("");
const originalSorted = [...assameseClusters].sort().join("");
assert.strictEqual(unscrambled, originalSorted);

// Test 2: Manipuri test word
const mniWord = "মৈতৈলোন্";
const mniClusters = getGraphemes(mniWord, "mni");
console.log("Manipuri clusters for 'মৈতৈলোন্':", mniClusters);
assert.strictEqual(mniClusters.join(""), mniWord);

// Test 3: Bengali test word
const bnWord = "প্রকৃতি";
const bnClusters = getGraphemes(bnWord, "bn");
console.log("Bengali clusters for 'প্রকৃতি':", bnClusters);
assert.strictEqual(bnClusters.join(""), bnWord);

// Test 4: Bodo test word
const brxWord = "संस्कृति";
const brxClusters = getGraphemes(brxWord, "brx");
console.log("Bodo clusters for 'संस्कृति':", brxClusters);
assert.strictEqual(brxClusters.join(""), brxWord);

console.log("✅ All grapheme cluster segmentation and roundtrip tests PASSED!");
