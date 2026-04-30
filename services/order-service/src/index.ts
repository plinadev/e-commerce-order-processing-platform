import "dotenv/config";
import express from "express";
import { prisma, registry } from "@ecommerce/shared";
import router from "./routes";
import { startConsumer } from "./consumer";
import { connectProducer, sseEvents } from "./controllers/order.controller";

const app = express();
app.use(express.json());

app.use("/orders", router);
app.get("/events", sseEvents);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

const PORT = process.env.ORDER_PORT || 3001;

async function start() {
  await prisma.$connect();
  await connectProducer();
  await startConsumer();
  app.listen(PORT, () => console.log(`order-service running on :${PORT}`));
}

start().catch(console.error);
