// One-off: print the active prompt body so we can inspect specific clauses.

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config as loadDotenv } from "dotenv";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: join(REPO_ROOT, ".env.local"), quiet: true });
loadDotenv({ path: join(REPO_ROOT, ".env"), quiet: true });

import { getActivePrompt } from "../lib/prompts.js";

async function main() {
  const p = await getActivePrompt();
  if (!p) {
    console.error("no active prompt");
    process.exit(1);
  }
  console.log(`# id=${p.id}  name=${JSON.stringify(p.name)}`);
  console.log(`# voice=${p.voice}  model=${p.model}  chars=${p.prompt.length}`);
  console.log();
  console.log(p.prompt);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exit(1);
});
