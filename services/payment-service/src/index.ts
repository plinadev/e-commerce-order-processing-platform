import 'dotenv/config';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createConsumer,
  createProducer,
  sendMessage,
  publishToDLQ,
  registry,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
  paymentSuccessTotal,
  paymentFailureTotal,
} from '@ecommerce/shared';

const app = express();

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

const PORT = process.env.PAYMENT_PORT || 3002;

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function simulatePayment(): boolean {
  return Math.random() < 0.8;
}

async function processPayment(orderId: string): Promise<boolean> {
  const ms = 1000 + Math.random() * 2000;
  await delay(ms);
  return simulatePayment();
}

async function start() {
  const producer = createProducer();
  await producer.connect();

  const consumer = createConsumer('payment-service');
  await consumer.connect();
  await consumer.subscribe({ topic: 'orders', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      const order = JSON.parse(raw);
      const { orderId } = order;

      let success = false;
      let lastError = '';

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          success = await processPayment(orderId);
          if (success) break;
          lastError = 'Payment declined';
        } catch (err) {
          lastError = (err as Error).message;
        }

        if (!success && attempt < 2) {
          await delay(1000 * Math.pow(2, attempt));
        }
      }

      const paymentId = uuidv4();
      const processedAt = new Date().toISOString();

      if (success) {
        paymentSuccessTotal.inc();
        await sendMessage(producer, 'payments', {
          paymentId,
          orderId,
          status: 'SUCCESS',
          processedAt,
          failureReason: null,
        });
      } else {
        paymentFailureTotal.inc();
        await publishToDLQ(producer, message, lastError, 3);
        await sendMessage(producer, 'payments', {
          paymentId,
          orderId,
          status: 'FAILED',
          processedAt,
          failureReason: lastError,
        });
      }

      kafkaMessagesConsumed.inc({ topic, group: 'payment-service' });
      console.log(`Payment ${success ? 'SUCCESS' : 'FAILED'} for order ${orderId}`);
    },
  });

  app.listen(PORT, () => console.log(`payment-service running on :${PORT}`));
}

start().catch(console.error);
