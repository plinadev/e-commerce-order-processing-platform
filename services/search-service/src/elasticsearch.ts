import { Client } from "@elastic/elasticsearch";

export const es = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://elasticsearch:9200",
});

export const INDEX = "orders";

export async function ensureIndex(): Promise<void> {
  const exists = await es.indices.exists({ index: INDEX });
  if (exists) return;

  await es.indices.create({
    index: INDEX,
    mappings: {
      properties: {
        orderId: { type: "keyword" },
        userId: { type: "keyword" },
        totalAmount: { type: "float" },
        status: { type: "keyword" },
        paymentStatus: { type: "keyword" },
        courier: { type: "keyword" },
        processedAt: { type: "date" },
        createdAt: { type: "date" },
        updatedAt: { type: "date" },
        items: {
          type: "nested",
          properties: {
            productId: { type: "keyword" },
            quantity: { type: "integer" },
            price: { type: "float" },
          },
        },
      },
    },
  });
}
