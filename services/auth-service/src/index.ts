import 'dotenv/config';
import express from 'express';
import { prisma } from '@ecommerce/shared';
import { registry } from '@ecommerce/shared';
import router from './routes';

const app = express();
app.use(express.json());

app.use('/auth', router);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

const PORT = process.env.AUTH_PORT || 3006;

async function start() {
  await prisma.$connect();
  app.listen(PORT, () => console.log(`auth-service running on :${PORT}`));
}

start().catch(console.error);
