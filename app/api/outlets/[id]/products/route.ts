import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outletProduct, product, outlet, outletAdmin } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiResponse, OutletProduct } from "@/lib/types";

type ProductWithAvailability = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  outletProductId: string | null;
  isAvailable: boolean | null;
  customPrice: string | null;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const params = await context.params;
    const outletId = params.id;

    // Check if user owns the outlet or is an admin
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

    const isOwner = outletData[0].ownerId === session.user.id;

    const adminCheck = await db
      .select()
      .from(outletAdmin)
      .where(
        and(
          eq(outletAdmin.outletId, outletId),
          eq(outletAdmin.userId, session.user.id)
        )
      )
      .limit(1);

    const isAdmin = adminCheck.length > 0;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view products for this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Get all products created by the outlet owner with outlet availability
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        outletProductId: outletProduct.id,
        isAvailable: outletProduct.isAvailable,
        customPrice: outletProduct.customPrice,
      })
      .from(product)
      .leftJoin(
        outletProduct,
        and(
          eq(outletProduct.productId, product.id),
          eq(outletProduct.outletId, outletId)
        )
      )
      .where(eq(product.createdBy, outletData[0].ownerId));

    return NextResponse.json({
      success: true,
      data: products,
    } as ApiResponse<ProductWithAvailability[]>);
  } catch (error) {
    console.error("Error fetching outlet products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch outlet products",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const params = await context.params;
    const outletId = params.id;
    const body = (await req.json()) as {
      productId: string;
      customPrice?: string;
    };

    if (!body.productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if user owns the outlet or is an admin
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

    const isOwner = outletData[0].ownerId === session.user.id;

    const adminCheck = await db
      .select()
      .from(outletAdmin)
      .where(
        and(
          eq(outletAdmin.outletId, outletId),
          eq(outletAdmin.userId, session.user.id)
        )
      )
      .limit(1);

    const isAdmin = adminCheck.length > 0;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to add products to this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Validate custom price if provided
    if (body.customPrice) {
      const price = parseFloat(body.customPrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid custom price" } as ApiResponse<never>,
          { status: 400 }
        );
      }
    }

    // Check if product already added
    const existing = await db
      .select()
      .from(outletProduct)
      .where(
        and(
          eq(outletProduct.outletId, outletId),
          eq(outletProduct.productId, body.productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product already added to this outlet",
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const newOutletProduct = await db
      .insert(outletProduct)
      .values({
        id: nanoid(),
        outletId,
        productId: body.productId,
        customPrice: body.customPrice || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newOutletProduct[0],
      } as ApiResponse<OutletProduct>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding product to outlet:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add product to outlet",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
