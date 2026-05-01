import { Request, Response } from "express";
import { es, INDEX } from "../elasticsearch";

export async function searchOrders(req: Request, res: Response): Promise<void> {
  const { q, status, page = "1", limit = "10" } = req.query;
  const from = (parseInt(String(page)) - 1) * parseInt(String(limit));
  const size = parseInt(String(limit));

  const must: object[] = [];

  if (q) {
    must.push({
      multi_match: {
        query: String(q),
        fields: ["orderId", "userId", "status", "courier"],
      },
    });
  }

  if (status) {
    must.push({ term: { status: String(status) } });
  }

  const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

  const result = await es.search({
    index: INDEX,
    from,
    size,
    query,
    sort: [{ createdAt: { order: "desc" } }],
  });

  const hits = result.hits.hits.map((h) => h._source);
  const total =
    typeof result.hits.total === "number"
      ? result.hits.total
      : (result.hits.total?.value ?? 0);

  res.json({ total, page: parseInt(String(page)), results: hits });
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const result = await es.get({ index: INDEX, id: req.params.id });
    res.json(result._source);
  } catch {
    res.status(404).json({ error: "Order not found" });
  }
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  const result = await es.search({
    index: INDEX,
    size: 0,
    aggs: {
      totalRevenue: { sum: { field: "totalAmount" } },
      avgOrderAmount: { avg: { field: "totalAmount" } },
    },
  });

  const aggs = result.aggregations as Record<string, { value: number }>;

  res.json({
    totalOrders:
      typeof result.hits.total === "number"
        ? result.hits.total
        : (result.hits.total?.value ?? 0),
    totalRevenue: aggs?.totalRevenue?.value ?? 0,
    avgOrderAmount: aggs?.avgOrderAmount?.value ?? 0,
  });
}
