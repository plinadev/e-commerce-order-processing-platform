import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authMiddleware } from "./middleware/auth";

const app = express();

app.use(authMiddleware);

const proxy = (target: string, pathPrefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/api/${pathPrefix}`]: `/${pathPrefix}` },
    on: {
      error: (err, _req, res) => {
        (res as express.Response)
          .status(502)
          .json({ error: "Service unavailable" });
      },
    },
  });

app.use("/api/auth", proxy(`http://auth-service:3006`, "auth"));
app.use("/api/orders", proxy(`http://order-service:3001`, "orders"));
app.use("/api/events", proxy(`http://order-service:3001`, "events"));
app.use("/api/products", proxy(`http://product-service:3007`, "products"));
app.use("/api/search", proxy(`http://search-service:3005`, "search"));
app.use("/api/analytics", proxy(`http://analytics-service:3004`, "analytics"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.GATEWAY_PORT || 8000;
app.listen(PORT, () => console.log(`api-gateway running on :${PORT}`));
