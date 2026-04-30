import 'dotenv/config';
import express from 'express';
import {
  createConsumer,
  createProducer,
  sendMessage,
  registry,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
} from '@ecommerce/shared';

const COURIERS = ['Іван', 'Марія', 'Олег', 'Аня', 'Тарас', 'Оля'];
const STAGES = ['PREPARING', 'SHIPPED', 'DELIVERED'] as const;

const app = express();

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

const PORT = process.env.DELIVERY_PORT || 3003;

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

async function runDelivery(producer: ReturnType<typeof createProducer>, orderId: string): Promise<void> {
  const courier = COURIERS[Math.floor(Math.random() * COURIERS.length)];

  for (const status of STAGES) {
    await delay(5000);
    await sendMessage(producer, 'order.status.updated', {
      orderId,
      status,
      courier,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Order ${orderId} → ${status} (courier: ${courier})`);
  }
}

async function start() {
  const producer = createProducer();
  await producer.connect();

  const consumer = createConsumer('delivery-service');
  await consumer.connect();
  await consumer.subscribe({ topic: 'payments', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value!.toString());

        if (payload.status === 'FAILED') {
          console.log(`Skipping failed payment for order ${payload.orderId}`);
          return;
        }

        kafkaMessagesConsumed.inc({ topic, group: 'delivery-service' });

        // Run delivery stages in background — don't await so consumer keeps processing
        runDelivery(producer, payload.orderId).catch((err) => {
          kafkaConsumerErrors.inc({ topic, group: 'delivery-service' });
          console.error(`Delivery error for order ${payload.orderId}:`, err);
        });
      } catch (err) {
        kafkaConsumerErrors.inc({ topic, group: 'delivery-service' });
        console.error('delivery-service consumer error:', err);
      }
    },
  });

  app.listen(PORT, () => console.log(`delivery-service running on :${PORT}`));
}

start().catch(console.error);
