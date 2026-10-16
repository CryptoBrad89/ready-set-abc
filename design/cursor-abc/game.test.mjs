import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LETTERS, letterChoices, pictureChoices } from "./js/letters.js";

const root = dirname(fileURLToPath(import.meta.url));
const shaList = readFileSync("/cursor/stores/bc-69cca2ee-086d-4958-861f-572ca096de17/approved-sha256.txt", "utf8");
const expected = new Map();
shaList.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  const [sha, name] = trimmed.split(/\s+/);
  expected.set(name, sha);
});

let failed = 0;
function check(name, ok) {
  if (!ok) {
    failed += 1;
    console.error("FAIL", name);
  }
}

const audioDir = join(root, "audio");
const files = readdirSync(audioDir).filter((name) => name.endsWith("-trim.mp3"));
check("53 trim files", files.length === 53 && files.length === expected.size);
files.forEach((name) => {
  const digest = createHash("sha256").update(readFileSync(join(audioDir, name))).digest("hex");
  check(`sha ${name}`, digest === expected.get(name));
});

const clips = JSON.parse(readFileSync(join(audioDir, "clips.json"), "utf8"));
check("clips items", clips.items.length === 54);
clips.items.forEach((item) => {
  const file = String(item.trimmed || "").split("/").pop();
  check(`clip file ${item.id}`, expected.has(file));
});
const ids = new Set(clips.items.map((item) => item.id));
LETTERS.forEach((item) => {
  check(`name ${item.letter}`, ids.has(`${item.letter.toLowerCase()}-name`));
  check(`sound ${item.letter}`, ids.has(`${item.letter.toLowerCase()}-sound`));
});
check("long i", ids.has("i-long-extra"));

["lucy-default.jpg", "lucy-specs.jpg", "lucy-bows.jpg", "lucy-celebrate.jpg"].forEach((name) => {
  const lock = createHash("sha256").update(readFileSync(join(root, "lucy-lock", name))).digest("hex");
  const src = createHash("sha256").update(readFileSync(join(root, "../assets", name))).digest("hex");
  check(`lock ${name}`, lock === src);
});

const artDir = join(root, "art");
if (existsSync(artDir)) {
  const lockHashes = new Set(readdirSync(join(root, "lucy-lock")).map((name) => (
    createHash("sha256").update(readFileSync(join(root, "lucy-lock", name))).digest("hex")
  )));
  readdirSync(artDir).forEach((name) => {
    const digest = createHash("sha256").update(readFileSync(join(artDir, name))).digest("hex");
    check(`fresh art ${name}`, !lockHashes.has(digest));
  });
}

const page = readFileSync(join(root, "index.html"), "utf8") + readFileSync(join(root, "js/game.js"), "utf8");
check("game does not show the lock stills", !page.includes("lucy-lock"));

const rng = () => 0.1;
LETTERS.forEach((item) => {
  const cards = pictureChoices(item, 4, rng);
  check(`${item.letter} picture count`, cards.length === Math.min(4, 1 + LETTERS.filter((other) => other.sound !== item.sound).reduce((n, other) => n + other.pictures.length, 0)));
  check(`${item.letter} one correct`, cards.filter((card) => card.ok).length === 1);
  const correct = cards.find((card) => card.ok);
  check(`${item.letter} correct word`, item.pictures.some((pic) => pic.word === correct.word));
  cards.filter((card) => !card.ok).forEach((card) => {
    const owner = LETTERS.find((other) => other.pictures.some((pic) => pic.word === card.word));
    check(`${item.letter} distractor ${card.word}`, owner && owner.sound !== item.sound);
  });
  const shape = letterChoices(item, 4, "both", rng);
  check(`${item.letter} shape`, shape.cards.filter((card) => card.ok).length === 1);
  check(`${item.letter} sample`, shape.cards.some((card) => card.ok && card.glyph === shape.sample));
});

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("cookie table checks passed");
