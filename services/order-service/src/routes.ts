import { Router } from 'express';
import { createOrder, getOrder, listOrders, sseEvents } from './controllers/order.controller';

const router = Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/events', sseEvents);
router.get('/:id', getOrder);

export default router;
