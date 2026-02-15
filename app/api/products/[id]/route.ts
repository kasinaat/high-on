import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import type { UpdateProductInput, ApiResponse, Product } from "@/lib/types";

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
    const productId = params.id;

    const productData = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (productData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (productData[0].createdBy !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view this product",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: productData[0],
    } as ApiResponse<Product>);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const productId = params.id;
    const body = (await req.json()) as UpdateProductInput;

    // Check if product exists and user is the creator
    const productData = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (productData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (productData[0].createdBy !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to update this product",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Validate price if provided
    if (body.basePrice) {
      const price = parseFloat(body.basePrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid price" } as ApiResponse<never>,
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.imageUrl !== undefined && body.imageUrl) updateData.imageUrl = body.imageUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await db
      .update(product)
      .set(updateData)
      .where(eq(product.id, productId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated[0],
    } as ApiResponse<Product>);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const productId = params.id;

    // Check if product exists and user is the creator
    const productData = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (productData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (productData[0].createdBy !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to delete this product",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    await db.delete(product).where(eq(product.id, productId));

    return NextResponse.json({
      success: true,
      data: { message: "Product deleted successfully" },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
