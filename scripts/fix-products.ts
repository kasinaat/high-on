import "dotenv/config";
import { db } from "@/db";
import { product } from "@/db/schema";
import { isNull } from "drizzle-orm";

async function fixProducts() {
  console.log("Fixing products with null imageUrl...");
  
  const result = await db
    .update(product)
    .set({ imageUrl: "https://via.placeholder.com/400x300?text=Product+Image" })
    .where(isNull(product.imageUrl));

  console.log("Updated products:", result);
  console.log("Done!");
  process.exit(0);
}

fixProducts().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
