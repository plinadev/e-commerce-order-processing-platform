import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@ecommerce/shared";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().min(1),
  emoji: z.string().optional(),
  stock: z.number().int().min(0),
});

export async function listProducts(req: Request, res: Response): Promise<void> {
  const { q, category, minPrice, maxPrice, inStock } = req.query;

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: String(q), mode: "insensitive" } },
      { description: { contains: String(q), mode: "insensitive" } },
    ];
  }
  if (category) where.category = String(category);
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(String(minPrice)) } : {}),
      ...(maxPrice ? { lte: parseFloat(String(maxPrice)) } : {}),
    };
  }
  if (inStock === "true") where.stock = { gt: 0 };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
}

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  const result = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  res.json(result.map((r: any) => r.category));
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }
  const product = await prisma.product.create({ data: result.data });
  res.status(201).json(product);
}

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const result = productSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: result.data,
    });
    res.json(product);
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
}
