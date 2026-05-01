import "dotenv/config";
import express from "express";
import { prisma, registry } from "@ecommerce/shared";
import router from "./routes";

const app = express();
app.use(express.json());

app.use("/products", router);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

const PORT = process.env.PRODUCT_PORT || 3007;

async function start() {
  await prisma.$connect();
  app.listen(PORT, () => console.log(`product-service running on :${PORT}`));
}

start().catch(console.error);
