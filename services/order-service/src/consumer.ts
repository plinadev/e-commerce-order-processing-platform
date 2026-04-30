import { createConsumer, prisma, kafkaMessagesConsumed, kafkaConsumerErrors } from '@ecommerce/shared';
import { pushToAll } from './sse';

export async function startConsumer(): Promise<void> {
  const consumer = createConsumer('order-service');

  await consumer.connect();
  await consumer.subscribe({ topic: 'order.status.updated', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value!.toString());
        const { orderId, status, courier } = payload;

        await prisma.order.update({
          where: { id: orderId },
          data: { status, courier, updatedAt: new Date() },
        });

        pushToAll({ orderId, status, courier, updatedAt: new Date().toISOString() });

        kafkaMessagesConsumed.inc({ topic, group: 'order-service' });
      } catch (err) {
        kafkaConsumerErrors.inc({ topic, group: 'order-service' });
        console.error('order-service consumer error:', err);
      }
    },
  });
}
