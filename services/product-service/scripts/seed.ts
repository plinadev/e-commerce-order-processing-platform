import "dotenv/config";
import { prisma } from "@ecommerce/shared";

const products = [
  {
    name: "Wireless Headphones",
    description: "Premium sound quality",
    price: 89.99,
    category: "Electronics",
    emoji: "🎧",
    stock: 50,
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB backlit, tactile switches",
    price: 129.99,
    category: "Electronics",
    emoji: "⌨️",
    stock: 30,
  },
  {
    name: "Running Shoes",
    description: "Lightweight and breathable",
    price: 74.99,
    category: "Sports",
    emoji: "👟",
    stock: 100,
  },
  {
    name: "Coffee Maker",
    description: "Brews 12 cups",
    price: 49.99,
    category: "Kitchen",
    emoji: "☕",
    stock: 25,
  },
  {
    name: "Yoga Mat",
    description: "Non-slip, 6mm thick",
    price: 29.99,
    category: "Sports",
    emoji: "🧘",
    stock: 60,
  },
  {
    name: "Desk Lamp",
    description: "LED, adjustable brightness",
    price: 39.99,
    category: "Home",
    emoji: "💡",
    stock: 40,
  },
  {
    name: "Backpack",
    description: "30L waterproof",
    price: 59.99,
    category: "Accessories",
    emoji: "🎒",
    stock: 45,
  },
  {
    name: "Water Bottle",
    description: "Insulated, 1L",
    price: 24.99,
    category: "Sports",
    emoji: "🍶",
    stock: 80,
  },
];

async function main() {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log('Products already seeded');
    return;
  }
  await prisma.product.createMany({ data: products });
  console.log(`Seeded ${products.length} products`);
}


main()
  .then(() => prisma.$disconnect())
  .catch(console.error);
