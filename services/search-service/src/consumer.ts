import {
  createConsumer,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
} from "@ecommerce/shared";
import { es, INDEX } from "./elasticsearch";

async function upsert(id: string, doc: object): Promise<void> {
  await es.update({
    index: INDEX,
    id,
    body: {
      doc,
      doc_as_upsert: true,
    },
  });
}

export async function startConsumer(): Promise<void> {
  const consumer = createConsumer("search-service");
  await consumer.connect();

  await consumer.subscribe({
    topics: ["orders", "payments", "order.status.updated", "orders.DLQ"],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value!.toString());

        if (topic === "orders") {
          await upsert(payload.orderId, {
            orderId: payload.orderId,
            userId: payload.userId,
            items: payload.items,
            totalAmount: payload.totalAmount,
            status: "PENDING",
            paymentStatus: null,
            courier: null,
            processedAt: null,
            createdAt: payload.createdAt,
            updatedAt: payload.createdAt,
          });
        }

        if (topic === "order.status.updated") {
          await upsert(payload.orderId, {
            status: payload.status,
            courier: payload.courier,
            updatedAt: payload.updatedAt,
          });
        }

        if (topic === "payments") {
          await upsert(payload.orderId, {
            paymentStatus: payload.status,
            processedAt: payload.processedAt,
            ...(payload.status === "FAILED" ? { status: "FAILED" } : {}),
          });
        }

        if (topic === "orders.DLQ") {
          const original = JSON.parse(payload.originalMessage?.value || "{}");
          if (original.orderId) {
            await upsert(original.orderId, { status: "payment_failed" });
          }
        }

        kafkaMessagesConsumed.inc({ topic, group: "search-service" });
      } catch (err) {
        kafkaConsumerErrors.inc({ topic, group: "search-service" });
        console.error(`search-service error on topic ${topic}:`, err);
      }
    },
  });
}
