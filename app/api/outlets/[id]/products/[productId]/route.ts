import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outletProduct, outlet, outletAdmin } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import type { ApiResponse, OutletProduct } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
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
    const productId = params.productId;
    const body = (await req.json()) as {
      isAvailable?: boolean;
      customPrice?: string | null;
    };

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
          error: "You don't have permission to update products for this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Validate custom price if provided
    if (body.customPrice !== undefined && body.customPrice !== null && body.customPrice !== "") {
      const price = parseFloat(body.customPrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid custom price" } as ApiResponse<never>,
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.customPrice !== undefined) {
      updateData.customPrice = body.customPrice === "" || body.customPrice === null ? null : body.customPrice;
    }

    const updated = await db
      .update(outletProduct)
      .set(updateData)
      .where(
        and(
          eq(outletProduct.outletId, outletId),
          eq(outletProduct.productId, productId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found in this outlet",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated[0],
    } as ApiResponse<OutletProduct>);
  } catch (error) {
    console.error("Error updating outlet product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update outlet product",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
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
    const productId = params.productId;

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
          error: "You don't have permission to remove products from this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(outletProduct)
      .where(
        and(
          eq(outletProduct.outletId, outletId),
          eq(outletProduct.productId, productId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found in this outlet",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Product removed from outlet successfully" },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error removing product from outlet:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove product from outlet",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
