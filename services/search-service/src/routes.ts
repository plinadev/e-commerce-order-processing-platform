import { Router } from "express";
import {
  searchOrders,
  getOrderById,
  getStats,
} from "./controllers/search.controller";

const router = Router();

router.get("/", searchOrders);
router.get("/stats", getStats);
router.get("/orders/:id", getOrderById);

export default router;
