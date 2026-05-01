import "dotenv/config";
import express from "express";
import { registry } from "@ecommerce/shared";
import { ensureIndex } from "./elasticsearch";
import { startConsumer } from "./consumer";
import router from "./routes";

const app = express();
app.use(express.json());

app.use("/search", router);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

const PORT = process.env.SEARCH_PORT || 3005;

async function start() {
  await ensureIndex();
  await startConsumer();
  app.listen(PORT, () => console.log(`search-service running on :${PORT}`));
}

start().catch(console.error);
