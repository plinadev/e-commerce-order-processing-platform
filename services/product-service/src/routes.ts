import { Router } from "express";
import { adminOnly } from "./middleware/adminOnly";
import {
  listProducts,
  getCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./controllers/product.controller";

const router = Router();

router.get("/", listProducts);
router.get("/categories", getCategories);
router.get("/:id", getProduct);
router.post("/", adminOnly, createProduct);
router.put("/:id", adminOnly, updateProduct);
router.delete("/:id", adminOnly, deleteProduct);

export default router;
