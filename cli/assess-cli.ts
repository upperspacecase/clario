// assess-cli — local bridge between the GetHours skill pipeline and Firestore.
// Subcommands: fetch | write | log-run
// Loads .env.local from the repo root (regardless of cwd) so it works when
// invoked from a runs/{id} sibling dir or from anywhere else.

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config as loadDotenv } from "dotenv";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: join(REPO_ROOT, ".env.local"), quiet: true });
loadDotenv({ path: join(REPO_ROOT, ".env"), quiet: true });

import { runFetch } from "./fetch.js";
import { runWrite } from "./write.js";
import { runLogRun } from "./log-run.js";

type ParsedArgs = {
  positional: string[];
  flags: Record<string, string | boolean>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith("--")) {
      const name = tok.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(tok);
    }
  }
  return { positional, flags };
}

function fail(msg: string, code = 1): never {
  console.error(`[assess-cli] ${msg}`);
  process.exit(code);
}

function usage(): never {
  console.error(
    [
      "assess-cli — GetHours pipeline ↔ Firestore bridge",
      "",
      "Usage:",
      "  assess-cli fetch   --id <assessmentId> --out <dir>",
      "  assess-cli write   --id <assessmentId> --from <dir>",
      "  assess-cli log-run --id <assessmentId> --status <running|success|failed>",
      "                     [--error <msg>] [--report-path <path>]",
    ].join("\n"),
  );
  process.exit(2);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) usage();

  const cmd = argv[0];
  const { flags } = parseArgs(argv.slice(1));

  if (cmd === "fetch") {
    const id = flags.id as string | undefined;
    const out = flags.out as string | undefined;
    if (!id || !out) fail("fetch requires --id and --out");
    await runFetch({ assessmentId: id!, outDir: out! });
    return;
  }

  if (cmd === "write") {
    const id = flags.id as string | undefined;
    const from = flags.from as string | undefined;
    if (!id || !from) fail("write requires --id and --from");
    await runWrite({ assessmentId: id!, fromDir: from! });
    return;
  }

  if (cmd === "log-run") {
    const id = flags.id as string | undefined;
    const status = flags.status as string | undefined;
    if (!id || !status) fail("log-run requires --id and --status");
    if (status !== "running" && status !== "success" && status !== "failed") {
      fail(`log-run --status must be running|success|failed (got ${status})`);
    }
    await runLogRun({
      assessmentId: id!,
      status: status as "running" | "success" | "failed",
      error: typeof flags.error === "string" ? flags.error : undefined,
      reportPath:
        typeof flags["report-path"] === "string"
          ? (flags["report-path"] as string)
          : undefined,
    });
    return;
  }

  if (cmd === "--help" || cmd === "-h" || cmd === "help") usage();

  fail(`unknown command: ${cmd}`);
}

main().catch((e) => {
  console.error("[assess-cli] fatal:", e instanceof Error ? e.stack : e);
  process.exit(1);
});
