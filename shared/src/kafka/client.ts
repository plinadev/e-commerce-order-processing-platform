import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';
import { kafkaMessagesProduced, kafkaMessagesConsumed, kafkaConsumerErrors } from './metrics';

const kafka = new Kafka({
  clientId: 'ecommerce',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  retry: { retries: 5 },
});

export function createProducer(): Producer {
  return kafka.producer();
}

export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({ groupId });
}

export async function publishToDLQ(
  producer: Producer,
  originalMessage: KafkaMessage,
  error: string,
  retryCount: number
): Promise<void> {
  await producer.send({
    topic: 'orders.DLQ',
    messages: [
      {
        value: JSON.stringify({
          originalMessage: {
            key: originalMessage.key?.toString(),
            value: originalMessage.value?.toString(),
          },
          error,
          retryCount,
          failedAt: new Date().toISOString(),
        }),
      },
    ],
  });
  kafkaMessagesProduced.inc({ topic: 'orders.DLQ' });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
}

export async function sendMessage(
  producer: Producer,
  topic: string,
  payload: object
): Promise<void> {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
  kafkaMessagesProduced.inc({ topic });
}
