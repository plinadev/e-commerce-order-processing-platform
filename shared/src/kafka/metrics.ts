import { Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

export const kafkaMessagesProduced = new Counter({
  name: 'kafka_messages_produced_total',
  help: 'Total Kafka messages produced',
  labelNames: ['topic'],
  registers: [registry],
});

export const kafkaMessagesConsumed = new Counter({
  name: 'kafka_messages_consumed_total',
  help: 'Total Kafka messages consumed',
  labelNames: ['topic', 'group'],
  registers: [registry],
});

export const kafkaConsumerErrors = new Counter({
  name: 'kafka_consumer_errors_total',
  help: 'Total Kafka consumer errors',
  labelNames: ['topic', 'group'],
  registers: [registry],
});

export const orderProcessingDuration = new Histogram({
  name: 'order_processing_duration_seconds',
  help: 'Order processing duration end-to-end',
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [registry],
});

export const paymentSuccessTotal = new Counter({
  name: 'payment_success_total',
  help: 'Total successful payments',
  registers: [registry],
});

export const paymentFailureTotal = new Counter({
  name: 'payment_failure_total',
  help: 'Total failed payments',
  registers: [registry],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});
