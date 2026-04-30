import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma, createProducer, sendMessage } from '@ecommerce/shared';
import { addClient, removeClient } from '../sse';

const producer = createProducer();
let producerConnected = false;

export async function connectProducer(): Promise<void> {
  await producer.connect();
  producerConnected = true;
}

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1),
});

export async function createOrder(req: Request, res: Response): Promise<void> {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }

  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { items } = result.data;
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      totalAmount,
      items: { create: items },
    },
    include: { items: true },
  });

  await sendMessage(producer, 'orders', {
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
  });

  res.status(201).json(order);
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (role !== 'admin' && order.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  res.json(order);
}

export async function listOrders(req: Request, res: Response): Promise<void> {
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  const orders = await prisma.order.findMany({
    where: role === 'admin' ? {} : { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
}

export async function sseEvents(req: Request, res: Response): Promise<void> {
  const userId = req.headers['x-user-id'] as string || uuidv4();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  addClient(userId, res);

  req.on('close', () => removeClient(userId, res));
}
