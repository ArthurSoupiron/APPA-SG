import { createApp } from "./app";
import { getBackendEnv } from "./config/env";
import { ensureDatabaseAvailable } from "./db";

await ensureDatabaseAvailable();

const app = createApp();

export default {
  port: getBackendEnv().port,
  fetch: app.fetch,
};
