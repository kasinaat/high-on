import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet, product, outletProduct } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/lib/types";

type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string; // Will be customPrice if set, otherwise basePrice
  basePrice: string;
  category: string | null;
  imageUrl: string;
  isActive: boolean;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const outletId = params.id;

    // Check if outlet exists and is active
    const outletData = await db
      .select()
      .from(outlet)
      .where(eq(outlet.id, outletId))
      .limit(1);

    if (outletData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Outlet not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (!outletData[0].isActive) {
      return NextResponse.json(
        { success: false, error: "Outlet is currently closed" } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Get all available products for this outlet
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        customPrice: outletProduct.customPrice,
        isAvailable: outletProduct.isAvailable,
      })
      .from(outletProduct)
      .innerJoin(product, eq(outletProduct.productId, product.id))
      .where(
        and(
          eq(outletProduct.outletId, outletId),
          eq(outletProduct.isAvailable, true),
          eq(product.isActive, true)
        )
      );

    // Format products with the right price (custom or base)
    const menuProducts: MenuProduct[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.customPrice || p.basePrice,
      basePrice: p.basePrice,
      category: p.category,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
    }));

    return NextResponse.json({
      success: true,
      data: {
        outlet: outletData[0],
        products: menuProducts,
      },
    } as ApiResponse<{ outlet: typeof outletData[0]; products: MenuProduct[] }>);
  } catch (error) {
    console.error("Error fetching outlet menu:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch menu",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
