import fs from "fs";
import path from "path";

// 1. Read /usr/share/dict/words if present
let sysWords = [];
if (fs.existsSync("/usr/share/dict/words")) {
  const raw = fs.readFileSync("/usr/share/dict/words", "utf8");
  sysWords = raw.split("\n");
}

// 2. Read project sentences
const sentencesPath = path.join(process.cwd(), "data/sentences.json");
const sentenceWords = new Set();
if (fs.existsSync(sentencesPath)) {
  const sentences = JSON.parse(fs.readFileSync(sentencesPath, "utf8"));
  for (const s of sentences) {
    const parts = s.text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/);
    for (const p of parts) {
      if (p.length >= 3 && p.length <= 15) {
        sentenceWords.add(p);
      }
    }
  }
}

// 3. Build comprehensive valid set
const allValidWords = new Set();
for (const w of sysWords) {
  const clean = w.trim().toLowerCase();
  if (/^[a-z]{3,15}$/.test(clean)) {
    allValidWords.add(clean);
  }
}
for (const w of sentenceWords) {
  allValidWords.add(w);
}

// 4. Ensure public/data directory exists
const publicDataDir = path.join(process.cwd(), "public/data");
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Save complete dictionary file
const sortedWords = Array.from(allValidWords).sort();
fs.writeFileSync(
  path.join(publicDataDir, "word-chain-dictionary.txt"),
  sortedWords.join("\n"),
  "utf8"
);

console.log(`Generated public/data/word-chain-dictionary.txt with ${sortedWords.length} words.`);

// 5. Build bot vocabulary from sentenceWords and most common words
// Index by starting letter a-z
const botByLetter = {};
for (let i = 97; i <= 122; i++) {
  botByLetter[String.fromCharCode(i)] = [];
}

for (const w of sortedWords) {
  const letter = w[0];
  // Include in bot vocab if it came from sentence pool or is a clean common word
  if (sentenceWords.has(w) || (w.length >= 3 && w.length <= 8)) {
    if (botByLetter[letter] && botByLetter[letter].length < 350) {
      botByLetter[letter].push(w);
    }
  }
}

const botVocabFile = `// Auto-generated bot vocabulary for Word Chain Clash
export const BOT_VOCABULARY: Record<string, string[]> = ${JSON.stringify(
  botByLetter,
  null,
  2
)};
`;

fs.writeFileSync(
  path.join(process.cwd(), "games/word-chain-clash/bot-vocabulary.ts"),
  botVocabFile,
  "utf8"
);

console.log("Generated games/word-chain-clash/bot-vocabulary.ts successfully!");
