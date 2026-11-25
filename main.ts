// Skillet Rush — hand-in program for the make.fun best-cooking-game bounty.
// Runs on Node 22 with the standard library only. It copies the static game/
// folder and the screenshots/ taken from its own browser renders into the
// grader's output directory, then builds dossier.json — the summary the judge
// reads — with the kit's vendored makefun-game library, unmodified.
//
// Locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, "game"), join(outputDir, "game"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), { recursive: true });

writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log("skillet-rush handed in:", outputDir);
