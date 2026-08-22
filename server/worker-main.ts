// Standalone worker entry for local runs: npm run worker
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local" });
loadDotenv();

import { startWorker } from "./worker.js";
startWorker();
